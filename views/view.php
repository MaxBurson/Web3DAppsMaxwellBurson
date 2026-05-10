
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <!-- fonts -->
  <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Oswald" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <link rel="stylesheet" href="../style.css">
  <title>Objects List | MVC View</title>
</head>
<body>

  <nav class="navbar navbar-expand-sm navbar-dark navbar_main">
    <div class="logo">
      <a class="navbar-brand" href="../index.html">
        <h1>3D Objects</h1>
        <h2>Interactive</h2>
      </a>
    </div>
  </nav>

  <div class="container-fluid main_contents">
    <h2>Objects | MVC View</h2>
    <div class="row">
      <?php if (!empty($data)): ?>
        <?php foreach ($data as $obj): ?>

          <div class="col-sm-4">
            <div class="card">
              <div class="card-body">
                <h4 class="card-title"><?php echo htmlspecialchars($obj['name']); ?></h4>
                <p class="card-text"><?php echo htmlspecialchars($obj['description']); ?></p>
                <a href="../<?php echo htmlspecialchars($obj['page']); ?>" class="btn btn-primary">View 3D Model</a>
              </div>
            </div>
          </div>

        <?php endforeach; ?>
      <?php else: ?>
        <p>No objects were found</p>

      <?php endif; ?>
    </div>
  </div>

</body>
</html>



