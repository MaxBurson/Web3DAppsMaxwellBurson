
<?php

require_once 'model.php';

$model  = new ObjectModel();
$action = isset($_GET['action']) ? $_GET['action'] : 'list';


switch ($action) {

    case 'list':
        $data = $model->getAll();
        require_once '../views/view.php';
        break;

    case 'get':
        header('Content-Type: application/json');
        $id   = isset($_GET['id']) ? (int)$_GET['id'] : 1;

        $data = $model->getById($id);
        echo json_encode($data);
        break;

    default:
        header('HTTP/1.0 404 Not Found');
        echo 'Action not found';
        break;
}
?>
