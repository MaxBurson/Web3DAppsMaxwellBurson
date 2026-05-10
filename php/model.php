<?php



class ObjectModel {

    private $db;

    public function __construct() {
        $dbPath = __DIR__ . '/../db/objects.sqlite';
        try {
            $this->db = new PDO('sqlite:' . $dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->createTable();
            $this->seedData();
            
        } catch (PDOException $e) {
            die(json_encode(['error' => $e->getMessage()]));
        }
    }

    private function createTable() {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS objects (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                description TEXT,
                model_path  TEXT,
                thumb_path  TEXT,
                page        TEXT
            )
        ");
    }

    private function seedData() {
        $count = $this->db->query("SELECT COUNT(*) FROM objects")->fetchColumn();
        if ($count == 0) {
            $stmt = $this->db->prepare("
                INSERT INTO objects (name, description, model_path, thumb_path, page)
                VALUES (:name, :desc, :model, :thumb, :page)
            ");
            $rows = [
                [
                    'name'  => 'Medkit',
                    'desc'  => 'A 3D model of a medkit, modelled in Blender.',
                    'model' => 'assets/models/Medkit/MedkitMaxwell.glb',
                    'thumb' => 'assets/images/medkit_thumb.jpg',
                    'page'  => 'medkit.html'
                ],
                [
                    'name'  => 'Compass',
                    'desc'  => 'A 3D model of a compass, modelled in Blender.',
                    'model' => 'assets/models/Compass/compassMaxwell.glb',
                    'thumb' => 'assets/images/compass_thumb.jpg',
                    'page'  => 'compass.html'
                ],
                [
                    'name'  => 'Flashlight',
                    'desc'  => 'A 3D model of a flashlight, modelled in Blender.',
                    'model' => 'assets/models/Flashlight/flashlightMaxwell.glb',
                    'thumb' => 'assets/images/flashlight_thumb.jpg',
                    'page'  => 'flashlight.html'
                ],
            ];

            foreach ($rows as $row) {
                $stmt->execute([
                    ':name'  => $row['name'],
                    ':desc'  => $row['desc'],
                    ':model' => $row['model'],
                    ':thumb' => $row['thumb'],
                    ':page'  => $row['page'],
                ]);
            }
        }
    }


    public function getAll() {
        $stmt = $this->db->query("SELECT * FROM objects ORDER BY id ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM objects WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

}



?>
