<?php
/**
 * Azaad Samachar (आज़ाद समाचार) - Social Crawler & Bot Pre-renderer
 * Hostinger Shared Hosting Deployment Bridge
 *
 * For social media preview scrapers that do NOT execute JavaScript
 * (WhatsApp, Facebook, Twitter/X, Telegram, LinkedIn, Pinterest, Discord):
 * This lightweight bridge fetches the article's authentic metadata directly
 * from Supabase REST API and outputs server-side Open Graph and Twitter Card tags.
 *
 * Ordinary human visitors and full JavaScript search engines (Googlebot) continue
 * to receive the standard high-performance React/Vite SPA bundle.
 */

header('Content-Type: text/html; charset=utf-8');

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$supabaseUrl = 'https://mqbegmviywgktnstaxpk.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xYmVnbXZpeXdna3Ruc3RheHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1Mzg5ODAsImV4cCI6MjA1NDExNDk4MH0.G9nFpD9B4Z23Zq9M2Xv7z_9yXv7z_9yXv7z_9yXv7z8'; // Supabase anon key

$productionDomain = 'https://azaadsamacharindia.com';
$defaultTitle = 'आज़ाद समाचार | निष्पक्ष • निर्भीक • डिजिटल न्यूज़ पोर्टल';
$defaultDesc = 'आज़ाद समाचार (Azaad Samachar) - भारत का विश्वसनीय और स्वतंत्र डिजिटल न्यूज़ पोर्टल।';
$defaultImage = $productionDomain . '/assets/logo.png';

$article = null;

if (!empty($slug)) {
    // Generate slug variants (raw, single encoded, decoded)
    $candidate = urlencode(urldecode($slug));
    $apiUrl = $supabaseUrl . '/rest/v1/articles?slug=in.("' . rawurlencode($slug) . '","' . $candidate . '")&status=eq.published&select=title,excerpt,location,published_at,updated_at,featured_media:media(public_url)&limit=1';

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if (!empty($data) && is_array($data)) {
            $article = $data[0];
        }
    }
}

if ($article) {
    $title = htmlspecialchars($article['title'] ?? $defaultTitle, ENT_QUOTES, 'UTF-8');
    $desc = htmlspecialchars($article['excerpt'] ?? $defaultDesc, ENT_QUOTES, 'UTF-8');
    $canonicalUrl = $productionDomain . '/news/' . rawurlencode($slug);
    $image = !empty($article['featured_media']['public_url']) ? $article['featured_media']['public_url'] : $defaultImage;
    $publishedAt = $article['published_at'] ?? '';
    $modifiedAt = $article['updated_at'] ?? $publishedAt;
} else {
    $title = $defaultTitle;
    $desc = $defaultDesc;
    $canonicalUrl = $productionDomain;
    $image = $defaultImage;
    $publishedAt = '';
    $modifiedAt = '';
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title><?php echo $title; ?> - आज़ाद समाचार</title>
  <meta name="description" content="<?php echo $desc; ?>">
  <link rel="canonical" href="<?php echo $canonicalUrl; ?>">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="आज़ाद समाचार (Azaad Samachar)">
  <meta property="og:url" content="<?php echo $canonicalUrl; ?>">
  <meta property="og:title" content="<?php echo $title; ?>">
  <meta property="og:description" content="<?php echo $desc; ?>">
  <meta property="og:image" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:locale" content="hi_IN">
  <?php if ($publishedAt): ?>
  <meta property="article:published_time" content="<?php echo htmlspecialchars($publishedAt, ENT_QUOTES, 'UTF-8'); ?>">
  <?php endif; ?>
  <?php if ($modifiedAt): ?>
  <meta property="article:modified_time" content="<?php echo htmlspecialchars($modifiedAt, ENT_QUOTES, 'UTF-8'); ?>">
  <?php endif; ?>

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@AzaadSamachar">
  <meta name="twitter:title" content="<?php echo $title; ?>">
  <meta name="twitter:description" content="<?php echo $desc; ?>">
  <meta name="twitter:image" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">

  <!-- Redirect non-bot visitors back to SPA -->
  <meta http-equiv="refresh" content="0; url=<?php echo $canonicalUrl; ?>">
</head>
<body>
  <h1><?php echo $title; ?></h1>
  <p><?php echo $desc; ?></p>
  <a href="<?php echo $canonicalUrl; ?>">पूरा समाचार पढ़ने के लिए यहाँ क्लिक करें</a>
</body>
</html>
