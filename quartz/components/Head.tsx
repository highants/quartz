// quartz/components/Head.tsx
import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
// Plugin.CustomOgImages() を使わないので CustomOgImagesEmitterName は不要
// import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    // ctx は CustomOgImagesEmitter の判定に使っていましたが、今回は不要です
    // ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const pageTitle =
      fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title
    const siteName = cfg.pageTitle ?? "" // サイト名を取得
    const title = pageTitle + titleSuffix // ページタイトルにサフィックスを追加
    const fullTitle = pageTitle + (siteName ? ` - ${siteName}` : "") // ページタイトルにサイト名を結合
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const RbaseUrl = cfg.baseUrl?.replace(/\/$/, "") ?? "example.com" // 末尾スラッシュ削除 & デフォルト値
    const url = new URL(`https://${RbaseUrl}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // 現在のページの完全なURL
    const socialUrl =
      fileData.slug === "404" ? url.toString() : new URL(joinSegments(RbaseUrl, fileData.slug!), `https://${RbaseUrl}`).toString()

    // --- featured_image 処理 ---
    const featuredImage = fileData.frontmatter?.featured_image as string | undefined
    let ogImageUrl: string
    let ogImageType: string

    const defaultOImagePath = `https://${RbaseUrl}/static/og-image.png` // デフォルトOGP画像の絶対パス

    if (featuredImage) {
      try {
        // featured_image のパスを解決
        const imagePath = featuredImage.startsWith("/") ? featuredImage.substring(1) : featuredImage
        // baseUrl と結合して絶対URLを生成
        ogImageUrl = new URL(joinSegments(RbaseUrl, imagePath), `https://${RbaseUrl}`).toString()
        ogImageType = `image/${getFileExtension(imagePath) ?? "png"}`
      } catch (e) {
        console.error(`Error creating URL for featured_image "${featuredImage}" in ${fileData.slug}: ${e}. Falling back to default OG image.`)
        // エラー時はデフォルト画像にフォールバック
        ogImageUrl = defaultOImagePath
        ogImageType = `image/${getFileExtension(defaultOImagePath) ?? "png"}`
      }
    } else {
      // featured_image がない場合はデフォルト画像を使用
      ogImageUrl = defaultOImagePath
      ogImageType = `image/${getFileExtension(defaultOImagePath) ?? "png"}`
    }
    // --- ここまで featured_image 処理 ---

    // CustomOgImagesEmitter は使わない前提なので、関連するチェックは削除
    // const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
    //   (e) => e.name === CustomOgImagesEmitterName,
    // )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {/* Google Fonts サブセット (オプション) */}
            {/* {cfg.theme.typography.title && cfg.pageTitle && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )} */}
          </>
        )}
        {/* <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" /> */} {/* 必要であればコメント解除 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* 基本的な OGP タグ */}
        <meta property="og:site_name" content={siteName} /> {/* サイト名を追加 */}
        <meta property="og:title" content={fullTitle} /> {/* 変更: ページタイトル + サイト名 */}
        <meta property="og:description" content={description} />
        {cfg.baseUrl && <meta property="og:url" content={socialUrl} /> }
        <meta property="og:type" content="website" />

        {/* Twitter Card タグ */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} /> {/* 変更: ページタイトル + サイト名 */}
        <meta name="twitter:description" content={description} />
        {cfg.baseUrl && <meta property="twitter:domain" content={RbaseUrl} />}
        {cfg.baseUrl && <meta property="twitter:url" content={socialUrl} />}

        {/* OGP 画像タグ (featured_image またはデフォルト) */}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:url" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} /> {/* HTTPS推奨 */}
        <meta property="og:image:type" content={ogImageType} />
        <meta property="og:image:alt" content={description} /> {/* 画像の代替テキスト */}
        {/* 推奨されるOGP画像サイズ */}
        {/* <meta property="og:image:width" content="1200" /> */}
        {/* <meta property="og:image:height" content="630" /> */}

        {/* Twitter Card 画像タグ (featured_image またはデフォルト) */}
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:alt" content={description} /> {/* 画像の代替テキスト */}

        {/* 削除: 元のデフォルト画像のみのロジック */}
        {/* {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            ...
          </>
        )} */}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* CSS, JS, 追加 Head 要素 */}
        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            // 関数として渡された追加 Head 要素を実行
            const result = resource(fileData)
            // 結果が null や undefined でないことを確認してからレンダリング
            return result ?? null
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  // Headコンポーネントは通常CSSを持たない
  // Head.css = ``

  return Head
}) satisfies QuartzComponentConstructor
