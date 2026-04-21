import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f4c81 0%, #1b263b 100%)",
          color: "#ffffff",
          fontSize: 170,
          fontWeight: 800,
          fontFamily: "sans-serif"
        }}
      >
        P
      </div>
    ),
    size
  );
}