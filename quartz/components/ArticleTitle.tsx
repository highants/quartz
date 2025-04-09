import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  font-size: 2.1rem;
  letter-spacing: 0.03em;
  line-height: 2.5rem;
  margin: 1rem 0rem 0.8rem 0rem;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
