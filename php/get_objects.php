<?php

header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');

require_once 'model.php';

$model   = new ObjectModel();

$objects = $model->getAll();

echo json_encode(['objects' => $objects]);



?>
