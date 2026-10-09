type IconProps = React.SVGProps<SVGSVGElement>

/**
 * The Vecora mark: the brand's favicon cut (a wider smile), meant for anything
 * under 32 px, which every use here is; above that the two cuts are hard to
 * tell apart. The viewBox is cropped to the ink (the tip's rounding lifts the
 * bottom to y 58.06), so it fills its box. One evenodd path: the smile is a
 * hole, not a second color. Shared with the PDF footer.
 */
export const VECORA_MARK = {
  width: 56,
  height: 51.06,
  viewBox: '4 7 56 51.06',
  path: 'M4 22A15 15 0 0 1 19 7H45A15 15 0 0 1 60 22V27.9A12 12 0 0 1 56.33 36.54L35.47 56.65A5 5 0 0 1 28.53 56.65L7.67 36.54A12 12 0 0 1 4 27.9Z M19 27.5C19 39.5 45 39.5 45 27.5H37.5C37.5 30.2 26.5 30.2 26.5 27.5Z',
}

/** The mark in the text color. */
export const VecoraIcon = (props: IconProps) => (
  <svg
    width={VECORA_MARK.width}
    height={VECORA_MARK.height}
    viewBox={VECORA_MARK.viewBox}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path fill="currentColor" fillRule="evenodd" d={VECORA_MARK.path} />
  </svg>
)
