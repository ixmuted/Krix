// Embedded icon assets for Krix
// Provides both HTTPS URL generators and embedded Base64 Data URIs for universal compatibility across MCP clients.

export interface McpIcon {
  src: string;
  url?: string;
  mimeType: string;
  type?: string;
  sizes?: string[];
  theme?: "light" | "dark";
}

export const ICON_48_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAAHdElNRQfqCwcFCzUigETvAAAQmUlEQVRYw5VZTYwcx3V+r6q6e3qmZ2ZndmZ3ubtcrVZciqREiowYUhBhw5YggBAYX2z5ZNgHnQIHcQIrh+Skqw4GjBxi2IBysBgFsRQkcqyYTmxZCiPborlrkhbJIb3c/7+Znd+eme7pn6qXQ80MlyKRIHUYNLqru169973ve/UG11qKiBARAD5zgYgABND/JaL9E+DBoacT9d8dznzkICIEgMEERWQJZXNohSAeMXUwb7Dq/V+9EhEhYwwRkLBvKOjf4WcQkYAQPmsTAQEBIuq5CKCIgCgmcCMkYGL/2kNT9MIPG8oYEwYwxqKeDHq+UkoRGcIUpsU4MoZEoCSRUoDQ9xjct6q/W+zbov0kGEiFQECECAMPfca9D4SGgAvkHAkwitTe9k55bQWjQMoAAE3LZMiBsYSTtp1swsk5maywuIyJpALtRQJChEEoB9ZoTylEAuRK9W/jalM+HGxtkFLEOXKBbqNZK++49Uq30wRJ48VCNpNmnIdhwBgnJTvdLhEZwoiVigmd0bHC+LRl21GkgAAZDiOgA4uIDEERZUzlxxgTByINC1xrqQeipu8iKkWmxQLfW7p1s1XekFGQTCazI9ncyGgkZaNesywrnU4bhhFFESKGYeR5nm0nEpbZ7XY7vSAzPj392BwiD0I5SBFAQAIiAI4qYZAjsNFTkeJD99036EHfKNPijb3Kzd/+JmUy5CydTtu2zTlXRFEYtVpNKWUYhqZpTkxMJBKJOI4BoNPpSClzuRxjrHT7dszw2B89XxifCAJ1HxiosQ0mk6QoUIwj0uAp22/KMFKmxZt75V/9x08KuVTSSU5PHwyC4M6dO8IQURj2ev7ExIRpmuPj4wCwtLRUqVQYYwCQyWRs267X61EUzc8ftjj/9JOPb//ud4xJzplSNMxaBigBY+CcMRj4D3TIaD/cABhjUvX+859/9PSRJzw/GBnJcs5LpdLs7KyU0nGcMAxd183n83t7ewDg+772SqFQAACllFKq3W5nMhnLspott90NegqPnTpl204cq/1+6ifi/kTez2P6wrLg2pVfH5wcZ8KwLDOVSlUqldHRUdu22+02ACQSCdM0Pc+bmpqK43h8fDybzdbr9dXVVSklYwwRHcdpNpu9Xs9J2rZtTEwe2F1f7fltxll/55qN6D7H6tXZflYlIi642/YtkNNTBxr1ejabDYIgCIJ8Ph8EAWOMMRbHsb7v+/7ExITrumNjY9PT06Zp3r1713VdwzA455lMptVqEUA6mQhb1eLU5MryMsoQBtF4JN2z4TM9uIB6ebOQTbc7HcdxhBBDrwCAlHLo3mw2S0SGYTiOU6vVMpnM5ORksVhcvnevWW8IITjnyWTSdV1DmAnOKutrB4rF3y8u2AkkAs3t+9m/DxjcPwCAoLy1pYg8z0/aSUTsdrupVAoAOOfZbFYppQ0SQliWFcdxJpMBgEqlQkRjY2NHjx27Xbpdr9U557ZtA0DX6yZSSRH5ceALAdvrG5bJdMgQAPs62Hcbo30DkKmYIq/jex4yZlqmUqrX66VSKe2bIAj2i2sYhlEUKaXy+Xy9Xt/b2/N93zTNM2fP7uzudLtdxlgymQyCQCmVTKW8Vi2TcTbvLSkNagCF8JmwPZBynKPvd6PQF4YpOGeM6fV0vJRSYRhqzA5f2d7e1tdTU1OmaW5sbLRaLaXU/Pz87u5uHMemaWrYMWSWgV67YyA1ahUhmBZlNcBLn4fuVxhEjIPbbBQKBaWUZVk6gZPJpLZGCGGapn5ZKUVElmVFUdRoNBBRg+nEiRPr6+ulUsnzPMuy1tfXOeeWZfm+T0BCWKDiOA47jfog93GA5j6SWN95/ShC5Lskpe/7QggiklJyzjudjjZfq4Tv+71ej3Mex/H8/Hwmk9HzPc9zHOfll1+WUl6+fNn3fc/zWq2WaZqaxxGZ4LzbaVMU93OfCAFMQYh9JDF9paslZLC3s5uwLGEYnHPtiaFXOOerq6thGBqGYRiGUgoRO53OE088oZSqVquZTGZra8s0zS9/+ctnz55dXV2dmZlpt9s7OzuIGEURIhicMYBEKtXPIEBAYqBIDbIM+tRECZttr96Le51sNosAGj1KKcaYXltKKaVERL1dItK0REQnT54MgmBjY2N9ff3evXtBEJw5c+bVV1/1PK9arQoh4jiO45gxFgS9Ti/MFsak1E4gBNZTHPohAwEIQiAALN8qLd+8NjMzFUYRInqel0wmdX5pKoqi6Mknn9RakUqlOOe+78dxHEVRq9UyDKPVahUKhXw+v7293ev1Njc3l5eXT506pXeilHa0LE5MWHZKawgBgBqWsoAIgpSq7VZXSzeEacwePWrKqE/ZnBNRFEVRFIVhqGF28OBB13U9zzMMI51Odzodz/OuXbs2Nzf34osvlsvljz/+uFwuf//73799+3Y+n3/jjTdc1+10Ovl8HhGUUrncaFKijCXcL9YQBkUSAIhrV//b4mz8sccfmz+0WirxOFIIiGiapuZArRjDGBWLxfX19UQioffr+/7x48cfe+wxzZw//OEPEfGVV155//33v/a1r+mge55XKBS0jiqpiAhYv+AYFNowVDDxzOlzwhIcKQ4h6HimgQxRKWWZVsttaY7WGReGYavVqtfrvV7Psiwl+0RgmiYArKysvPbaa0eOHHn55Zc7nc5Xv/rVF198cWlp6d69e3Nzc4jIGGeMrW9v2eksAOsnGALSfWu0uHIVSop1BQWIAIhKKWEIneRKqXK5vLW15bquJmXGWbVaBSLTNLngYRj6vn/p0qVz58699NJLS0tLW1tbr7zyyp07d27evLmxsYGIQRAIIZSSbquF3EAEQKXLNJ399z1EBAkOjPFIQRhHnTDI5HI6d0zT7HQ6nU7Htu35+flutzs6Orq7uzt5YLLb7YZxZBiG4EJ/6+zZs91uNwzD8+fPl0qlZrO5s7PDGPvc5z7neZ4QQieK4zhWIsk4SCUJGdMyOzgCAIBAhEAhSUQDTNOKfZ8hampOp9PNZnN6evru3btbW1tXrlzxPO/EiRNjY2Na6qMo0mSdTCaPHTum2Zxz7nne8vLy6OjoM888Uy6XNVk0m812u60ImGmYHLyQMaaV7AE1ExroitBAsBMpt1NTRACgq5xKpfKzn/3spz/9KSIeOnSoVCqFYdjtdj//+c+fOHGiXC7btt3r9QDAMAzNWJzzqamphYWFYrHY7XZ930+n01tbW4lEou26tuOMjReRCIFpSBNi/2BJpA0iBGSICGClUqzOer1eMplcWlrK5/Ojo6NPP/10sVjc2to6f/58u91utVqNRiOdTmcymc3NzUOHDmlQD0EQx7Ft267rjoyM1Go1InJdV+esbScksmR2tNuThByB+qAmpIFgCKQ+qGIJTn50b4uHPV8RSCk3NzdnZ2dd1z1y5AgRXblyxbZty7K+9KUvaXk6ffp0MpnknGsq11vUGletVsfHxzudThiG+XxeCEMIVqv5R/74tEAW6ENhv2HQL4z6oB7oGJAiK2HlJmera3cTwshms41Go1gsaiBrjj58+LCmY01R2h9aXvTnpJRCiMXFxW63a1lWr9fTlBaGHSeZViSmDhQtIg8IgAAYAySE/V0ApmsPBGCIcUTFAwcnHj/qekHScQzDqFarnPORkZFer1cqlX7xi1/Ytq2JWw/P8+I4xkEeCCGq1arneWfOnGk2m5xzRNR1XBBFHGWvUSWBAEqbNGg53D86M0IkBIWgiBBAxqo4OXXwyePtjieE6LTdrc3NdCajT2FbW1tra2umaQ4KBNSiJvtSib7vf/DBB7qAjKIol8txzhljqVSqVqvZyWSj2e1GIFW/FBswNe07KGod6VdFwBkPA1WcPBBLSjkZZ3yyvFddW1kpFAoTExNTU1M7OztXr15tNptSym63u7KyUiqVoijSwvK9730viqLl5WXTNLPZbCKRMAxDnxEsK5GwrGa9FvV8wzKkksPDuwa0rkP5X/7N60DAEIZlKRFwgYzB0p3bx5/7gp20azvblWplZGQkmUxqnJZKpWq1urKyokswKeX4+Ph3vvOd99577+tf/3q1Ws3lcnEc5/P5TqcTx7FhGAcOTEhFALSzs5PLF1Jpi3OQsi+RSP3iSLCBvA2PkAjaPsMPwoliaqp4zK01DAjL5XKxWGy32zMzM3fu3Dl06NDhw4e73a4mmzfffPO73/3uBx98MD8/f/369XQ6rfGudcP3/X67CNnkeP73i79FxtPZzPTjh0zDJiIEBCQFJJQixAdqf33Z7XZGcvmLf/+2H3QjrycoPn36VBiG9Xr9xo0bmqIcx0mlUhq2iPj222/Pz8/r6sd13YMHD8ZxnEqm0o4TxbFSamys6Lpuy22eOPVsu9WynKRlGJIUY4M2HJJARN0i6XdiAJQi04Qb167+9V/8ue97Q9K7ePHis88+22w2Hcd54403vv3tb8/MzBw7duwrX/nK3NwcEeVyuSiKgiA4evTo9evXJyYmRkZGAr+3sLh46/ateq0eRVG9Xq/X61JRvlB46fyFV7/5TcNOB4HknPVVbd1VQEhIBIAESikrwTdW7/3JF85VymUhBAGQUkT0zjvvPPXUU9vb25cvX3799dd1cmlb5+bmPvzww4WFhfPnzzcaDd/319bWKpXKkSNH6vX6a6+9tri4qIVl/6mZiE6fOfePP/63RDoXRVJ3BBkN26yqv7SdgH//lx9VymXNuUpKpdTMzMz09HQcx7Va7eLFi8N6TQihk2hqaurcuXOJRKJerzPGnnvuOd0uSqfTFy5c0Ayua/DhOdkwjKtXPv6rP/vThAkMEAk4DpoNA5PBMESt0n73H97WRDfsMl24cKHRaFiW9dZbby0tLentKqU0A01NTTHGRkZGAKDZbGo5O378uC6DTp8+PTk5qalBDUprpVQURZyLf333ny79+CeZDIulUvRgs0EplUzB7678+ubNT4diqZR6/vnnXde9dOkSEX3yySf7Gxd9NhvUuACwu7u7sbEBAJomfN8fHx9/4YUX4FGDSAHAm3/3t0EMyJDhoIM2lDfB4OqV3+xfQwgRBMFbb71FRAsLC5VK5eGmseM4Q1g4jpNIJKSU+Xy+UCj4vu84zlNPPZXL5R7uv+ggXP7wo9vXr6eSXEna19LTbWyAPyzd2f9OHMcLCwsA8N57733rW9+CR/V1Tp48OZSO48ePp1Kp5eXlRCIhhBgdHXVdd25urtvtPrK3zzmXMvzP93+cMEAqdT9kiMiF8D1Y/sPdz6yqP7S2tqZ7eA9v8aOPPvr000+FELohgYirq6u6apucnNQn7sOHDz/y/wa90K/+66MwAMY4I7yfhMLEvd2dzeUV0B3/B9/Z3/TY/wgRf/7zn3/jG9+4desWY2xnZ8dxHNd19SvvvPOOZVmGYXzxi18cIuHhLV1buLq6vJKwGbsvbkSGgO2NVbftwj4l2b/2w8Ea4mxxcfGXv/xlFEUnT57MZrOzs7Nra2vvvvvu6urq9vZ2p9M5d+4c7OvB7R+I2Gq17t6+ZZnAmC6Q+mdH2N5cD6MI/j9Dl2kTExMvvPBCNpvVvdG5ublyuaw7f6lUamVlZXZ29vHHHx8C4DNfAIDSzRscgQ0fM8aiAPZ2th/5zv85fvCDH1iWpSOlD7unTp3SiM5ms57nra2tnTlz5n/5+M2bN6SC/wGJd8JgCzOixwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0xMS0wN1QwNTowNzo1OSswMDowMBOanMQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMTEtMDdUMDU6MDc6NTkrMDA6MDBixyR4AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTExLTA3VDA1OjExOjUzKzAwOjAwXTL1bgAAAABJRU5ErkJggg==";
export const ICON_24_DATA_URI =
  "data:image/png;base64,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";

export const ICON_48_BUFFER = Buffer.from(
  ICON_48_DATA_URI.split(",")[1],
  "base64",
);
export const ICON_24_BUFFER = Buffer.from(
  ICON_24_DATA_URI.split(",")[1],
  "base64",
);
export const GITHUB_RAW_BASE_URL =
  "https://raw.githubusercontent.com/imunmuted/Krix/gem/assets";
export const GITHUB_ICON_48_URL = `${GITHUB_RAW_BASE_URL}/icon-48.png`;
export const GITHUB_ICON_128_URL = `${GITHUB_RAW_BASE_URL}/icon-128.png`;
export const GITHUB_ICON_192_URL = `${GITHUB_RAW_BASE_URL}/icon-192.png`;
export const GITHUB_ICON_512_URL = `${GITHUB_RAW_BASE_URL}/icon-512.png`;
export const GITHUB_LOGO_URL = `${GITHUB_RAW_BASE_URL}/logo.png`;
export const GITHUB_ICON_24_URL = `${GITHUB_RAW_BASE_URL}/icon-24.png`;

export const RENDER_PUBLIC_URL = "https://krix.onrender.com";
export const RENDER_ICON_48_URL = `${RENDER_PUBLIC_URL}/icon-48.png`;
export const RENDER_ICON_128_URL = `${RENDER_PUBLIC_URL}/icon-128.png`;
export const RENDER_ICON_192_URL = `${RENDER_PUBLIC_URL}/icon-192.png`;
export const RENDER_ICON_512_URL = `${RENDER_PUBLIC_URL}/icon-512.png`;
export const RENDER_LOGO_URL = `${RENDER_PUBLIC_URL}/logo.png`;
export const RENDER_ICON_24_URL = `${RENDER_PUBLIC_URL}/icon-24.png`;

export const DEFAULT_PUBLIC_URL = GITHUB_RAW_BASE_URL;

export function getServerIcons(
  baseUrl: string = DEFAULT_PUBLIC_URL,
): McpIcon[] {
  const base = baseUrl ? baseUrl.replace(/\/+$/, "") : GITHUB_RAW_BASE_URL;

  const icons: McpIcon[] = [
    // 1. High-availability public raw GitHub HTTPS URLs (HTTP 200, CORS *, max-age 300)
    {
      src: GITHUB_ICON_48_URL,
      url: GITHUB_ICON_48_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["48x48"],
      theme: "light",
    },
    {
      src: GITHUB_ICON_48_URL,
      url: GITHUB_ICON_48_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["48x48"],
      theme: "dark",
    },
    // 2. Active Render web service HTTPS endpoints (HTTP 200, immutable cache)
    {
      src: RENDER_ICON_48_URL,
      url: RENDER_ICON_48_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["48x48"],
      theme: "light",
    },
    {
      src: RENDER_ICON_48_URL,
      url: RENDER_ICON_48_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["48x48"],
      theme: "dark",
    },
    // 3. Higher resolution assets
    {
      src: GITHUB_ICON_128_URL,
      url: GITHUB_ICON_128_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["128x128"],
    },
    {
      src: RENDER_ICON_128_URL,
      url: RENDER_ICON_128_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["128x128"],
    },
    {
      src: GITHUB_LOGO_URL,
      url: GITHUB_LOGO_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["512x512"],
    },
    {
      src: RENDER_LOGO_URL,
      url: RENDER_LOGO_URL,
      mimeType: "image/png",
      type: "image/png",
      sizes: ["512x512"],
    },
  ];

  // Clients (e.g. Gemini) only trust icons hosted on the server's own origin, so when the server is
  // reached through its own host, advertise those first and keep the GitHub copies as fallbacks.
  if (
    base &&
    !base.includes("raw.githubusercontent.com") &&
    !base.includes("krix-gateway.onrender.com")
  ) {
    const own: McpIcon[] = [
      {
        src: `${base}/icon-48.png`,
        url: `${base}/icon-48.png`,
        mimeType: "image/png",
        type: "image/png",
        sizes: ["48x48"],
        theme: "light",
      },
      {
        src: `${base}/icon-48.png`,
        url: `${base}/icon-48.png`,
        mimeType: "image/png",
        type: "image/png",
        sizes: ["48x48"],
        theme: "dark",
      },
      {
        src: `${base}/icon-128.png`,
        url: `${base}/icon-128.png`,
        mimeType: "image/png",
        type: "image/png",
        sizes: ["128x128"],
      },
      {
        src: `${base}/icon-192.png`,
        url: `${base}/icon-192.png`,
        mimeType: "image/png",
        type: "image/png",
        sizes: ["192x192"],
      },
      {
        src: `${base}/icon-512.png`,
        url: `${base}/icon-512.png`,
        mimeType: "image/png",
        type: "image/png",
        sizes: ["512x512"],
      },
      {
        src: `${base}/logo.png`,
        url: `${base}/logo.png`,
        mimeType: "image/png",
        type: "image/png",
        sizes: ["512x512"],
      },
    ];
    const seen = new Set<string>();
    return [...icons, ...own].filter((i) => {
      const key = `${i.src}|${i.theme ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return icons;
}

// Icons for the MCP initialize response (serverInfo). Like the official GitHub MCP server, the first
// entries are embedded PNG data URIs so clients (e.g. Gemini) can render them without fetching a remote
// URL; the HTTPS variants follow as fallbacks. Kept out of getServerIcons() so tool listings and the
// registry manifests stay small.
export function getServerInfoIcons(
  baseUrl: string = DEFAULT_PUBLIC_URL,
): McpIcon[] {
  return [
    { src: ICON_48_DATA_URI, mimeType: "image/png", theme: "light" },
    { src: ICON_48_DATA_URI, mimeType: "image/png", theme: "dark" },
    ...getServerIcons(baseUrl),
  ];
}

export const SERVER_ICONS: McpIcon[] = getServerIcons();
