import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f4c81",
          color: "#ffffff",
          fontSize: 90,
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: 32
        }}
      >
        P
      </div>
    ),
    size
  );
}