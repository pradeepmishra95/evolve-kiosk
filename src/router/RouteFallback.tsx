export default function RouteFallback() {
 return (
  <div
   style={{
    minHeight: "var(--app-height, 100vh)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#071117",
    color: "#F7F1E6"
   }}
  >
   Loading...
  </div>
 )
}
