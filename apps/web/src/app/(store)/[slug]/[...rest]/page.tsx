import { notFound } from "next/navigation";

/** Unknown sub-paths of a store (e.g. legacy /restaurantes/<slug>/order/finish/) render the 404 page. */
export default function UnknownStorePath() {
  notFound();
}
