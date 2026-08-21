export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Blob verde sage — se mueve en diagonal lenta */}
      <div
        className="aurora-blob aurora-blob-1"
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          top: "-10%",
          left: "-5%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(111,169,140,0.20) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "aurora-drift-1 20s ease-in-out infinite",
        }}
      />

      {/* Blob mint — se mueve en horizontal */}
      <div
        className="aurora-blob aurora-blob-2"
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          top: "20%",
          right: "-10%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(157,201,180,0.18) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "aurora-drift-2 25s ease-in-out infinite",
        }}
      />

      {/* Blob verde brand — se mueve en vertical */}
      <div
        className="aurora-blob aurora-blob-3"
        style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          bottom: "-5%",
          left: "30%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)",
          filter: "blur(55px)",
          animation: "aurora-drift-3 18s ease-in-out infinite",
        }}
      />

      {/* Blob verde suave — efecto de profundidad */}
      <div
        className="aurora-blob aurora-blob-4"
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          top: "40%",
          left: "50%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,138,112,0.12) 0%, transparent 70%)",
          filter: "blur(45px)",
          animation: "aurora-drift-4 22s ease-in-out infinite",
        }}
      />
    </div>
  );
}
