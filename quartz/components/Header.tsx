import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? <header>{children}</header> : null
}

Header.css = `
header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2rem 0;
  gap: 5;
}

header h1 {
  margin: 0;
  flex: auto;
  font-size: 2.5rem;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
