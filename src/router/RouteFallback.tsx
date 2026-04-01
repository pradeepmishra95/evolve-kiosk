export default function RouteFallback() {
 return (
  <div
   style={{
    minHeight: "var(--app-height, 100vh)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000"
   }}
  >
   Loading...
  </div>
 )
}
