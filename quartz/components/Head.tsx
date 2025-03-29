// quartz/components/Head.tsx
import { i18n } from "../i18n"
// `joinSegments` はURL結合に使いにくいため、URLオブジェクトや手動結合を使う
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"

// URLを安全に結合するヘルパー関数
// base: e.g. https://example.com
// parts: e.g. ['blog', 'post'] or ['/assets/image.png']
function safeJoinUrl(base: string, ...parts: string[]): string {
  let currentUrl = base.replace(/\/$/, ""); // Ensure base doesn't end with /
  for (const part of parts) {
      if (!part) continue; // Skip empty parts
      const trimmedPart = part.replace(/^\/+/, ""); // Ensure part doesn't start with /
      if (trimmedPart) {
          currentUrl += "/" + trimmedPart;
      }
  }
  return currentUrl;
}


export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ?? // socialDescription を優先
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    // --- ベースURLの準備 (https:// の重複を防ぐ) ---
    let RbaseUrl = cfg.baseUrl ?? "example.com";
    // Remove potential protocol and trailing slash
    RbaseUrl = RbaseUrl.replace(/^(https?:\/\/)?/, "").replace(/\/$/, "");
    // Prepend https://
    const absoluteBaseUrl = `https://${RbaseUrl}`;

    // --- パスとURLの準備 ---
    const url = new URL(absoluteBaseUrl)
    const root = pathToRoot(fileData.slug!) // ルートへの相対パス (e.g. ../..)
    const iconPath = safeJoinUrl(root, "static/icon.png") // rootからの相対パスでアイコンを指定

    // 現在のページの完全なURL
    const pageSlug = fileData.slug === "index" ? "" : fileData.slug! // indexページはルート
    const socialUrl = fileData.slug === "404"
        ? absoluteBaseUrl // 404ページはベースURLそのもの
        : safeJoinUrl(absoluteBaseUrl, pageSlug) // ベースURLとスラグを結合

    // --- OGP/Twitter Card 画像の決定ロジック ---
    const featuredImage = fileData.frontmatter?.featured_image as string | undefined
    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const defaultOgImageName = "static/og-image.png" // デフォルト画像のサイトルートからの相対パス
    const ogImageDefaultPath = safeJoinUrl(absoluteBaseUrl, defaultOgImageName); // デフォルト画像の絶対URL

    let ogImageUrl = ogImageDefaultPath
    let ogImageType = `image/${getFileExtension(defaultOgImageName) ?? "png"}`

    if (featuredImage) {
      // featured_image が指定されている場合、それを最優先
      // フロントマターのパスはサイトルートからの相対パスと仮定
      // (例: /assets/image.png や _media/image.png)
      const imagePath = featuredImage.startsWith("/") ? featuredImage : "/" + featuredImage; // Ensure starts with / for safeJoinUrl
      ogImageUrl = safeJoinUrl(absoluteBaseUrl, imagePath); // 絶対URLを生成
      ogImageType = `image/${getFileExtension(featuredImage) ?? "png"}`
    }

    // デバッグ用ログ (必要に応じてコメントアウト解除)
    // console.log("Base URL:", absoluteBaseUrl);
    // console.log("Featured Image Path (from frontmatter):", featuredImage);
    // console.log("Calculated OG Image URL:", ogImageUrl);
    // console.log("Calculated Social URL:", socialUrl);
    // console.log("Icon Path:", iconPath);


    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* 基本的なOGP/Twitter Card情報 */}
        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={socialUrl}></meta> {/* socialUrl を使用 */}
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        {cfg.baseUrl && <meta property="twitter:domain" content={RbaseUrl}></meta> } {/* プロトコルなしのドメイン */}
        <meta property="twitter:url" content={socialUrl}></meta> {/* socialUrl を使用 */}
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* OGP/Twitter Card 画像 */}
        {ogImageUrl && ( // ogImageUrl が確定している場合のみ出力 (カスタムエミッター以外)
           !usesCustomOgImage || featuredImage // featuredImageがある場合はカスタムエミッターより優先
        ) ? (
          <>
            <meta property="og:image" content={ogImageUrl} />
            <meta property="og:image:url" content={ogImageUrl} />
            <meta property="og:image:secure_url" content={ogImageUrl} />
            <meta property="og:image:type" content={ogImageType} />
            <meta name="twitter:image" content={ogImageUrl} />
            <meta property="og:image:alt" content={description} />
            <meta name="twitter:image:alt" content={description} />
          </>
        ) : usesCustomOgImage ? (
           // カスタムエミッターを使う場合、代替テキストのみ設定
          <>
             <meta property="og:image:alt" content={description} />
             <meta name="twitter:image:alt" content={description} />
          </>
        ) : null /* ここに来ることはないはず */ }


        {/* その他 */}
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* 外部リソース */}
        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor