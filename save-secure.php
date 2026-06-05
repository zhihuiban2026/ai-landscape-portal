<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['index'], $input['description'], $input['password'])) {
  echo json_encode(['success' => false, 'error' => '缺少必要參數']);
  exit;
}

$file = __DIR__ . '/data.json';
$students = json_decode(file_get_contents($file), true);

if (!$students) {
  echo json_encode(['success' => false, 'error' => '資料讀取失敗']);
  exit;
}

$index = (int)$input['index'];

if ($index < 0 || $index >= count($students)) {
  echo json_encode(['success' => false, 'error' => '無效的索引']);
  exit;
}

$password = (string)$input['password'];
$expected = isset($students[$index]['password']) ? (string)$students[$index]['password'] : '';

if ($expected === '' || !hash_equals($expected, $password)) {
  echo json_encode(['success' => false, 'error' => '密碼錯誤']);
  exit;
}

$desc = trim((string)$input['description']);
if ($desc === '') {
  echo json_encode(['success' => false, 'error' => '請輸入研究介紹']);
  exit;
}

if (mb_strlen($desc) > 1000) {
  echo json_encode(['success' => false, 'error' => '介紹文字過長（上限 1000 字）']);
  exit;
}

$students[$index]['description'] = $desc;

if (file_put_contents($file, json_encode($students, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
  echo json_encode(['success' => false, 'error' => '寫入失敗，請聯繫管理員']);
  exit;
}

echo json_encode(['success' => true]);
