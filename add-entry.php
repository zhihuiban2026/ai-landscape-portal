<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$index = isset($_POST['index']) ? (int)$_POST['index'] : -1;
$date  = isset($_POST['date'])  ? trim($_POST['date'])  : date('Y-m-d');
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$text  = isset($_POST['text'])  ? trim($_POST['text'])  : '';
$blocksJson = isset($_POST['blocks']) ? $_POST['blocks'] : '';
$blocks = json_decode($blocksJson, true);
if (!is_array($blocks)) { $blocks = []; }

if ($index < 0) {
    echo json_encode(['success' => false, 'error' => '無效索引']);
    exit;
}

$students = json_decode(file_get_contents(__DIR__ . '/data.json'), true);
if (!$students || $index >= count($students)) {
    echo json_encode(['success' => false, 'error' => '無效索引']);
    exit;
}

if (empty($text) && empty($blocks) && empty($_FILES['images']['name'][0])) {
    echo json_encode(['success' => false, 'error' => '請填入說明或上傳圖片']);
    exit;
}

// Handle image uploads
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$imageFiles = [];
if (!empty($_FILES['images']['name'][0])) {
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $maxSize = 10 * 1024 * 1024; // 10MB

    foreach ($_FILES['images']['tmp_name'] as $k => $tmp) {
        if ($_FILES['images']['error'][$k] !== UPLOAD_ERR_OK) continue;
        if ($_FILES['images']['size'][$k] > $maxSize) continue;

        $origName = $_FILES['images']['name'][$k];
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) continue;

        // Verify it's actually an image
        $info = @getimagesize($tmp);
        if (!$info) continue;

        $newName = $index . '_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
        if (move_uploaded_file($tmp, $uploadDir . $newName)) {
            $imageFiles[] = $newName;
        }
    }
}

// Build rich layout blocks. Blocks support text/image order and text size.
$cleanBlocks = [];
foreach ($blocks as $block) {
    if (!is_array($block) || empty($block['type'])) continue;
    if ($block['type'] === 'text') {
        $content = trim((string)($block['content'] ?? ''));
        if ($content === '') continue;
        $size = (int)($block['size'] ?? 16);
        if ($size < 12) $size = 12;
        if ($size > 36) $size = 36;
        $cleanBlocks[] = [
            'type' => 'text',
            'content' => htmlspecialchars($content, ENT_QUOTES, 'UTF-8'),
            'size' => $size
        ];
    } elseif ($block['type'] === 'image') {
        $imageIndex = (int)($block['imageIndex'] ?? -1);
        if ($imageIndex >= 0 && isset($imageFiles[$imageIndex])) {
            $caption = trim((string)($block['caption'] ?? ''));
            $cleanBlocks[] = [
                'type' => 'image',
                'file' => $imageFiles[$imageIndex],
                'caption' => htmlspecialchars($caption, ENT_QUOTES, 'UTF-8')
            ];
        }
    }
}

// Backward-compatible fallback for old simple form data.
if (empty($cleanBlocks)) {
    if ($text !== '') {
        $cleanBlocks[] = [
            'type' => 'text',
            'content' => htmlspecialchars($text, ENT_QUOTES, 'UTF-8'),
            'size' => 16
        ];
    }
    foreach ($imageFiles as $file) {
        $cleanBlocks[] = [
            'type' => 'image',
            'file' => $file,
            'caption' => ''
        ];
    }
}

// Load and append to process data
$pf = __DIR__ . '/process-' . $index . '.json';
$entries = file_exists($pf) ? (json_decode(file_get_contents($pf), true) ?? []) : [];

$entries[] = [
    'date'       => htmlspecialchars($date, ENT_QUOTES, 'UTF-8'),
    'title'      => htmlspecialchars($title, ENT_QUOTES, 'UTF-8'),
    'text'       => htmlspecialchars($text, ENT_QUOTES, 'UTF-8'),
    'images'     => $imageFiles,
    'blocks'     => $cleanBlocks,
    'created_at' => date('Y-m-d H:i:s'),
];

if (file_put_contents($pf, json_encode($entries, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
    echo json_encode(['success' => false, 'error' => '寫入失敗，請聯繫管理員']);
    exit;
}

echo json_encode(['success' => true, 'images_saved' => count($imageFiles)]);
