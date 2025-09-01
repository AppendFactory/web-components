<?php
add_action('rest_api_init', function () {
    register_rest_route('miapi/v1', '/listados', array(
        'methods' => 'GET',
        'callback' => 'obtener_listados_filtrados_multiparam',
    ));
});

function obtener_listados_filtrados_multiparam($request) {
    $params = $request->get_params();

    $category   = $params['category'] ?? null;
    $destacado  = $params['destacado'] ?? null;
    $nombre     = $params['nombre'] ?? null;
    $tags       = $params['tags'] ?? null;
    $tab        = $params['tab'] ?? null;
    $ubicacion  = $params['ubicacion'] ?? null;
    $page       = isset($params['page']) ? max(1, intval($params['page'])) : 1;
    $per_page   = isset($params['per_page']) ? intval($params['per_page']) : 10;

    $args = array(
        'post_type'      => 'at_biz_dir',
        'post_status'    => 'publish',
        'posts_per_page' => -1 // 📌 Traemos todo para poder ordenar después
    );

    // 🔍 Búsqueda por nombre
    if (!empty($nombre)) {
        $args['s'] = sanitize_text_field($nombre);
    }

    // Tax Query
    $tax_query = [];

    if (!empty($tab)) {
        $parent_term = get_term_by('name', $tab, 'at_biz_dir-category');
        if ($parent_term) {
            $child_terms = get_terms(array(
                'taxonomy'   => 'at_biz_dir-category',
                'parent'     => $parent_term->term_id,
                'fields'     => 'ids',
                'hide_empty' => false
            ));
            if (!empty($child_terms)) {
                $tax_query[] = array(
                    'taxonomy'         => 'at_biz_dir-category',
                    'field'            => 'term_id',
                    'terms'            => $child_terms,
                    'include_children' => true
                );
            }
        }
    }

    if (!empty($category)) {
        $tax_query[] = array(
            'taxonomy' => 'at_biz_dir-category',
            'field'    => is_numeric($category) ? 'term_id' : 'slug',
            'terms'    => $category
        );
    }

    if (!empty($tags)) {
        $tax_query[] = array(
            'taxonomy' => 'at_biz_dir-tags',
            'field'    => is_numeric($tags) ? 'term_id' : 'slug',
            'terms'    => is_array($tags) ? $tags : explode(',', $tags),
        );
    }

    if (!empty($tax_query)) {
        $tax_query['relation'] = 'AND';
        $args['tax_query'] = $tax_query;
    }

    // Meta Query
    $meta_query = array('relation' => 'AND');

    if (!is_null($destacado)) {
        $meta_query[] = array(
            'key'     => '_custom-checkbox',
            'value'   => 'a:1:{i:0;s:4:"True";}',
            'compare' => '='
        );
    }

    if (!empty($ubicacion)) {
        $meta_query[] = array(
            'key'     => '_address',
            'value'   => $ubicacion,
            'compare' => 'LIKE'
        );
    }

    if (count($meta_query) > 1) {
        $args['meta_query'] = $meta_query;
    }

    // 📦 Ejecutar query sin paginar (para ordenar después)
    $query = new WP_Query($args);

    $listados = [];

    foreach ($query->posts as $post) {
        $meta = get_post_meta($post->ID);

        $thumbnail_id = get_post_thumbnail_id($post->ID);
        $thumbnail_url = $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : null;

        $prv_img_id = $meta['_listing_prv_img'][0] ?? null;
        $prv_img_url = $prv_img_id ? wp_get_attachment_url($prv_img_id) : null;

        $checkbox = maybe_unserialize($meta['_custom-checkbox'][0] ?? []);
        $is_featured = (!empty($checkbox) && in_array('True', $checkbox)) ? 'Destacado' : 'Normal';

        $social = maybe_unserialize($meta['_social'][0] ?? []);
        $gallery_ids = maybe_unserialize($meta['_listing_img'][0] ?? []);
        $gallery_urls = [];

        if (!empty($gallery_ids) && is_array($gallery_ids)) {
            foreach ($gallery_ids as $img_id) {
                $url = wp_get_attachment_url($img_id);
                if ($url) $gallery_urls[] = $url;
            }
        }

        $tags = wp_get_post_terms($post->ID, 'at_biz_dir-tags', array('fields' => 'names'));

        $listados[] = array(
            'id'          => $post->ID,
            'title'       => get_the_title($post->ID),
            'content'     => apply_filters('the_content', $post->post_content),
            'link'        => get_permalink($post->ID),
            'thumbnail'   => $thumbnail_url,
            'prv_image'   => $prv_img_url,
            'gallery'     => $gallery_urls,
            'type'        => $is_featured,
            'category'    => $meta['_directory_type'][0] ?? null,
            'tags'        => $tags,
            'description_short' => $meta['_custom-textarea-2'][0] ?? '',
            'description_full'  => $meta['_custom-textarea-3'][0] ?? '',
            'lat'         => $meta['_manual_lat'][0] ?? null,
            'lng'         => $meta['_manual_lng'][0] ?? null,
            'address'     => $meta['_address'][0] ?? '',
            'phone'       => $meta['_phone'][0] ?? '',
            'whatsapp'    => $meta['_phone2'][0] ?? '',
            'email'       => $meta['_email'][0] ?? '',
            'website'     => $meta['_website'][0] ?? '',
            'store'       => $meta['_custom-url'][0] ?? '',
            'direct_contact' => $meta['_custom-text'][0] ?? '',
            'social'      => $social
        );
    }

    // ✅ Ordenar destacados primero
    $destacados = array_filter($listados, fn($item) => $item['type'] === 'Destacado');
    $normales   = array_filter($listados, fn($item) => $item['type'] === 'Normal');
    $listados_ordenados = array_merge($destacados, $normales);

    // 📦 Calcular paginación manual
    $total = count($listados_ordenados);
    $pages = ceil($total / $per_page);
    $offset = ($page - 1) * $per_page;
    $paginados = array_slice($listados_ordenados, $offset, $per_page);

    // 📤 Devolver respuesta paginada
    return [
        'items'        => $paginados,
        'total'        => $total,
        'pages'        => $pages,
        'current_page' => $page,
    ];
}

add_action('rest_api_init', function () {
    register_rest_route('miapi/v1', '/listados/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'obtener_listado_por_id',
    ));
});
 
function obtener_listado_por_id($data) {
    $post_id = $data['id'];
    $post = get_post($post_id);

    if (!$post || $post->post_type !== 'at_biz_dir') {
        return new WP_Error('no_listado', 'Listado no encontrado', array('status' => 404));
    }

    return formatear_listado($post);
}
// Función auxiliar para formatear un solo post como en la lista
function formatear_listado($post) {
    $meta = get_post_meta($post->ID);

    $thumbnail_id = get_post_thumbnail_id($post->ID);
    $thumbnail_url = $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : null;

    $prv_img_id = $meta['_listing_prv_img'][0] ?? null;
    $prv_img_url = $prv_img_id ? wp_get_attachment_url($prv_img_id) : null;

    $checkbox = maybe_unserialize($meta['_custom-checkbox'][0] ?? []);
    $is_featured = (!empty($checkbox) && in_array('True', $checkbox)) ? 'Destacado' : 'Normal';

    $social = maybe_unserialize($meta['_social'][0] ?? []);

    $gallery_ids = maybe_unserialize($meta['_listing_img'][0] ?? []);
    $gallery_urls = [];

    if (!empty($gallery_ids) && is_array($gallery_ids)) {
        foreach ($gallery_ids as $img_id) {
            $url = wp_get_attachment_url($img_id);
            if ($url) $gallery_urls[] = $url;
        }
    }

    $tags = wp_get_post_terms($post->ID, 'at_biz_dir-tags', ['fields' => 'names']);

    // ✅ Obtener notas personalizadas
    $notas_raw = get_post_meta($post->ID, '_mis_notas_personalizadas', true);
    $notas = [];

    if (!empty($notas_raw) && is_array($notas_raw)) {
        foreach ($notas_raw as $nota) {
            $imagenes_ids = explode(',', $nota['imagenes']);
            $imagenes_urls = [];

            foreach ($imagenes_ids as $img_id) {
                $img_url = wp_get_attachment_url($img_id);
                if ($img_url) $imagenes_urls[] = $img_url;
            }

            $notas[] = [
                'texto'    => $nota['texto'],
                'imagenes' => $imagenes_urls
            ];
        }
    }
	
	$horarios_raw = get_post_meta($post->ID, '_mis_horarios_personalizados', true);
	$dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
	$horarios = [];

	foreach ($dias as $dia) {
		$desde1 = $horarios_raw[$dia]['desde1'] ?? '';
		$hasta1 = $horarios_raw[$dia]['hasta1'] ?? '';
		$desde2 = $horarios_raw[$dia]['desde2'] ?? '';
		$hasta2 = $horarios_raw[$dia]['hasta2'] ?? '';

		$horarios[$dia] = [
			'desde1' => $desde1,
			'hasta1' => $hasta1,
			'desde2' => $desde2,
			'hasta2' => $hasta2
		];
	}

    return [
        'id'          => $post->ID,
        'title'       => get_the_title($post->ID),
        'content'     => apply_filters('the_content', $post->post_content),
        'link'        => get_permalink($post->ID),
        'thumbnail'   => $thumbnail_url,
        'prv_image'   => $prv_img_url,
        'gallery'     => $gallery_urls,
        'type'        => $is_featured,
        'category'    => $meta['_directory_type'][0] ?? null,
        'tags'        => $tags,
        'description_short' => $meta['_custom-textarea-2'][0] ?? '',
        'description_full'  => $meta['_custom-textarea-3'][0] ?? '',
        'lat'         => $meta['_manual_lat'][0] ?? null,
        'lng'         => $meta['_manual_lng'][0] ?? null,
        'address'     => $meta['_address'][0] ?? '',
        'phone'       => $meta['_phone'][0] ?? '',
        'whatsapp'    => $meta['_phone2'][0] ?? '',
        'email'       => $meta['_email'][0] ?? '',
        'website'     => $meta['_website'][0] ?? '',
        'store'       => $meta['_custom-url'][0] ?? '',
		'direct_contact'       => $meta['_custom-text'][0] ?? '',
        'social'      => $social,
        'notas'       => $notas,
        'horarios'    => $horarios
    ];
}

add_action('rest_api_init', function () {
    register_rest_route('miapi/v1', '/categorias', array(
        'methods' => 'GET',
        'callback' => 'obtener_categorias_por_padre',
    ));
});

function obtener_categorias_por_padre($request) {
     $parent_name = $request->get_param('parent');
    $parent_term = get_term_by('name', $parent_name, 'at_biz_dir-category');

    if (!$parent_term) {
        return [];
    }

    $child_terms = get_terms(array(
        'taxonomy'   => 'at_biz_dir-category',
        'parent'     => $parent_term->term_id,
        'hide_empty' => false
    ));

    $categorias = array();

    foreach ($child_terms as $term) {
        $categorias[] = array(
            'id'   => $term->term_id,
            'name' => $term->name
        );
    }

    return $categorias;
}

add_action('rest_api_init', function () {
    register_rest_route('miapi/v1', '/locations', array(
        'methods'  => 'GET',
        'callback' => 'obtener_ubicaciones_con_hijas',
    ));
});

function obtener_ubicaciones_con_hijas() {
    $ubicaciones_padre = get_terms(array(
        'taxonomy'   => 'at_biz_dir-location',
        'parent'     => 0,
        'hide_empty' => false
    ));

    $resultado = array();

    foreach ($ubicaciones_padre as $padre) {
        $hijas = get_terms(array(
            'taxonomy'   => 'at_biz_dir-location',
            'parent'     => $padre->term_id,
            'hide_empty' => false
        ));

        $resultado[] = array(
            'id'       => $padre->term_id,
            'name'     => $padre->name,
            'children' => array_map(function ($hija) {
                return array(
                    'id'   => $hija->term_id,
                    'name' => $hija->name
                );
            }, $hijas)
        );
    }

    return $resultado;
}

function importar_proveedores_csv($archivo_csv) {
    if (!file_exists($archivo_csv) || !is_readable($archivo_csv)) {
        return 'Archivo no encontrado o ilegible.';
    }

    $header = null;
    $data = array();

    if (($handle = fopen($archivo_csv, 'r')) !== false) {
        while (($row = fgetcsv($handle, 1000, ',')) !== false) {
            if (!$header) {
                $header = $row;
            } else {
                $data[] = array_combine($header, $row);
            }
        }
        fclose($handle);
    }

    foreach ($data as $item) {
        // Crear el listing
        $post_id = wp_insert_post(array(
            'post_title'   => $item['titulo'],
            'post_status'  => 'publish',
            'post_type'    => 'at_biz_dir'
        ));

        if (is_wp_error($post_id)) continue;

        // Categoría
        if (!empty($item['categoria'])) {
            wp_set_object_terms($post_id, explode('|', $item['categoria']), 'at_biz_dir-category');
        }

        // Tags
        if (!empty($item['tags'])) {
            wp_set_object_terms($post_id, explode('|', $item['tags']), 'at_biz_dir-tags');
        }

        // Metadatos personalizados
        $campos = array(
            '_address'             => 'direccion',
            '_manual_lat'          => 'lat',
            '_manual_lng'          => 'lng',
            '_phone'               => 'telefono',
            '_email'               => 'email',
            '_website'             => 'web',
            '_custom-url'          => 'tienda',
            '_custom-textarea'     => 'nota',
			'_custom-textarea-2'   => 'descripcion',
            '_custom-checkbox'     => 'destacado'
        );

        foreach ($campos as $meta_key => $csv_key) {
            if (isset($item[$csv_key])) {
                update_post_meta($post_id, $meta_key, $item[$csv_key]);
            }
        }

        // Imagen destacada desde URL
        if (!empty($item['imagen_destacada'])) {
            $imagen_id = media_sideload_image($item['imagen_destacada'], $post_id, null, 'id');
            if (!is_wp_error($imagen_id)) {
                set_post_thumbnail($post_id, $imagen_id);
            }
        }

        // Galería (URLs separadas por | )
        if (!empty($item['galeria'])) {
            $urls = explode('|', $item['galeria']);
            $ids = array();

            foreach ($urls as $url) {
                $img_id = media_sideload_image($url, $post_id, null, 'id');
                if (!is_wp_error($img_id)) {
                    $ids[] = $img_id;
                }
            }
            if (!empty($ids)) {
                update_post_meta($post_id, '_listing_img', maybe_serialize($ids));
            }
        }
    }

    return 'Importación completada.';
}


add_action('admin_menu', function() {
    add_submenu_page(
        'edit.php?post_type=at_biz_dir', // lo cuelga del menú Directorist
        'Importar Proveedores',
        'Importar CSV',
        'manage_options',
        'importar-proveedores',
        'render_import_page'
    );
});

function render_import_page() {
    if (!empty($_FILES['csv_file']['tmp_name'])) {
        check_admin_referer('importar_csv_nonce'); // Seguridad WordPress
        $file = $_FILES['csv_file']['tmp_name'];
        $mensaje = importar_proveedores_csv($file);
        echo '<div class="notice notice-success"><p>' . esc_html($mensaje) . '</p></div>';
    }

    ?>
    <div class="wrap">
        <h1>Importar Proveedores desde CSV</h1>
        <form method="post" enctype="multipart/form-data">
            <?php wp_nonce_field('importar_csv_nonce'); ?>
            <input type="file" name="csv_file" required>
            <button type="submit" class="button button-primary">Importar</button>
        </form>
    </div>
    <?php
}

add_action('add_meta_boxes', function() {
    add_meta_box(
        'horarios_personalizados',
        'Horarios por Día',
        'mostrar_metabox_horarios_personalizados',
        'at_biz_dir',
        'normal',
        'default'
    );
});

function mostrar_metabox_horarios_personalizados($post) {
    $horarios = get_post_meta($post->ID, '_mis_horarios_personalizados', true);
    $horarios = is_array($horarios) ? $horarios : [];

    $dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

    echo '<div id="horarios-container">';

    foreach ($dias as $dia) {
        $desde1 = esc_attr($horarios[$dia]['desde1'] ?? '');
        $hasta1 = esc_attr($horarios[$dia]['hasta1'] ?? '');
        $desde2 = esc_attr($horarios[$dia]['desde2'] ?? '');
        $hasta2 = esc_attr($horarios[$dia]['hasta2'] ?? '');

        echo "<p><strong>" . ucfirst($dia) . ":</strong><br/>";
        echo "Desde: <input type='time' name='horarios_personalizados[{$dia}][desde1]' value='{$desde1}' />";
        echo " Hasta: <input type='time' name='horarios_personalizados[{$dia}][hasta1]' value='{$hasta1}' />";
        echo "<br/>";
        echo "Desde: <input type='time' name='horarios_personalizados[{$dia}][desde2]' value='{$desde2}' />";
        echo " Hasta: <input type='time' name='horarios_personalizados[{$dia}][hasta2]' value='{$hasta2}' />";
        echo "</p>";
    }

    echo '</div>';
}

add_action('save_post_at_biz_dir', function($post_id){
    if (isset($_POST['horarios_personalizados'])) {
        $horarios_sanitizados = [];

        foreach ($_POST['horarios_personalizados'] as $dia => $valores) {
            $desde1 = sanitize_text_field($valores['desde1']);
            $hasta1 = sanitize_text_field($valores['hasta1']);
            $desde2 = sanitize_text_field($valores['desde2']);
            $hasta2 = sanitize_text_field($valores['hasta2']);

            $horarios_sanitizados[$dia] = [
                'desde1' => $desde1,
                'hasta1' => $hasta1,
                'desde2' => $desde2,
                'hasta2' => $hasta2
            ];
        }

        update_post_meta($post_id, '_mis_horarios_personalizados', $horarios_sanitizados);
    } else {
        delete_post_meta($post_id, '_mis_horarios_personalizados');
    }
});

add_action('admin_footer', function() {
    global $post;
    if ($post && $post->post_type === 'at_biz_dir') : ?>
    <script>
        jQuery(document).ready(function($){
            let checkbox = $('input[name="never_expire"]');
            if (checkbox.length && !checkbox.prop('checked')) {
                checkbox.prop('checked', true);
            }
        });
    </script>
    <?php endif;
});