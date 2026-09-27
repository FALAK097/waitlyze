import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import shapes from "@dicebear/styles/shapes.json" with { type: "json" };

const style = new Style(shapes);

// Server component: generate once per render, no avatar service or client generator bundle.
// Pass an opaque ID, never an email address. Adjacent names make the image decorative.
export function Avatar({ id, src, alt = "", size = 40 }) {
  const source = src || new DiceBearAvatar(style, { seed: String(id), size }).toDataUri();
  return <img className="product-avatar" src={source} alt={alt} width={size} height={size} />;
}
