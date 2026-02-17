import amongusImage from "../assets/event_imgs/amongus.jpg";
import datathonImage from "../assets/event_imgs/datathon.jpg";
import hackathonImage from "../assets/event_imgs/hackathon.jpg";
import houdiniImage from "../assets/event_imgs/houdini.jpg";
import pixelImage from "../assets/event_imgs/pixel.jpg";
import promptImage from "../assets/event_imgs/prompt.jpg";

const localEventImages = [
  hackathonImage,
  datathonImage,
  promptImage,
  pixelImage,
  houdiniImage,
  amongusImage,
];

const keywordMap = [
  { keywords: ["hack", "code", "dev", "tech"], image: hackathonImage },
  { keywords: ["data", "analytics", "insight", "ml"], image: datathonImage },
  { keywords: ["prompt", "ai", "llm", "genai"], image: promptImage },
  { keywords: ["design", "ui", "ux", "pixel"], image: pixelImage },
  { keywords: ["magic", "houdini", "creative"], image: houdiniImage },
  { keywords: ["among", "game", "fun", "play"], image: amongusImage },
];

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getEventImageUrl = (event = {}) => {
  if (event.bannerImage) return event.bannerImage;

  const sourceText = `${event.title || ""} ${event.type || ""}`.toLowerCase();

  const matched = keywordMap.find(({ keywords }) =>
    keywords.some((keyword) => sourceText.includes(keyword)),
  );

  if (matched) return matched.image;

  const fallbackIndex = hashString(event.title || "event") % localEventImages.length;
  return localEventImages[fallbackIndex];
};
