import { Line, Lyrics, Part, VoiceType, Word } from "./page";

const types: VoiceType[] = ["lead", "background", "duet"];

export function compressLyrics(lyrics: Lyrics): any {
  let final = [];
  for (let lineIndex = 0; lineIndex < lyrics.lines.length; lineIndex++) {
    const line = lyrics.lines[lineIndex];
    for (let wordIndex = 0; wordIndex < line.line.length; wordIndex++) {
      const word = line.line[wordIndex];
      if (word.parts.length === 0) continue;
      final.push(types.indexOf(word.type));
      for (let partIndex = 0; partIndex < word.parts.length; partIndex++) {
        const part = word.parts[partIndex];
        let partPart = [part.text, part.time];
        if (part.endTime !== undefined) {
          partPart.push(part.endTime);
        }
        final.push(partPart);
      }
    }
    if (lineIndex !== lyrics.lines.length - 1) {
      final.push("");
    }
  }
  return final;
}

const isNumber = (val: any) => typeof val === "number" && val === val;

export function decompressLyrics(compressedLyrics: any[]) {
  const lyrics: Lyrics = {
    lines: [
      {
        before: [],
        line: [],
        after: [],
        duet: [],
        index: 0,
      },
    ],
    types: [],
  };

  let currentType: VoiceType | undefined;
  let line = 0;
  let word = -1;
  let part = 0;
  for (const o of compressedLyrics) {
    if (isNumber(o)) {
      word++;
      currentType = types[o];
      if (!lyrics.types.includes(currentType)) {
        lyrics.types.push(currentType);
      }
      lyrics.lines[line].line.push({
        index: word,
        parts: [],
        type: currentType,
      });
    } else if (o === "") {
      if (word === -1) {
        lyrics.lines[line].line.push({
          index: 0,
          parts: [],
          type: "lead",
        });
      }
      line++;
      word = -1;
      part = 0;
      lyrics.lines.push({
        before: [],
        line: [],
        duet: [],
        after: [],
        index: line,
      });
    } else {
      const partText = o[0] as string;
      const partTime = o[1] as number;
      const partEndTime = o[2] as number | undefined;
      const toPush = partEndTime
        ? {
            text: partText,
            time: partTime,
            endTime: partEndTime,
          }
        : {
            text: partText,
            time: partTime,
          };
      lyrics.lines[line].line[word].parts.push(toPush);
      part++;
    }
  }

  return lyrics;
}

// export function compressLyrics(lyrics: Lyrics): CompressedLyrics {
//   const compressed: CompressedLyrics = [lyrics.types.length];

//   lyrics.types.forEach((type) => compressed.push(type));

//   lyrics.lines.forEach((line) => {
//     compressed.push(
//       line.index,
//       line.before.length,
//       line.line.length,
//       line.after.length
//     );

//     const allWords = [...line.before, ...line.line, ...line.after];
//     allWords.forEach((word) => {
//       compressed.push(word.type, word.index, word.parts.length);
//       word.parts.forEach((part) => {
//         if (part.time === null) {
//           compressed.push(0, part.text);
//         } else if (part.endTime === undefined) {
//           compressed.push(1, part.text, part.time);
//         } else {
//           compressed.push(2, part.text, part.time, part.endTime);
//         }
//       });
//     });
//   });

//   return compressed;
// }

// export function decompressLyrics(compressed: CompressedLyrics): Lyrics {
//   let index = 0;
//   const typesCount = compressed[index++] as number;
//   const types = compressed.slice(index, index + typesCount) as VoiceType[];
//   index += typesCount as number;

//   const lines: Line[] = [];
//   while (index < compressed.length) {
//     const lineIndex = compressed[index++] as number;
//     const beforeCount = compressed[index++] as number;
//     const lineCount = compressed[index++] as number;
//     const afterCount = compressed[index++] as number;

//     const allWords: Word[] = [];
//     for (let i = 0; i < beforeCount + lineCount + afterCount; i++) {
//       const type = compressed[index++] as VoiceType;
//       const wordIndex = compressed[index++] as number;
//       const partsCount = compressed[index++] as number;

//       const parts: Part[] = [];
//       for (let j = 0; j < partsCount; j++) {
//         const partType = compressed[index++] as number;
//         if (partType === 0) {
//           parts.push({ text: compressed[index++] as string, time: null });
//         } else if (partType === 1) {
//           parts.push({
//             text: compressed[index++] as string,
//             time: compressed[index++] as number,
//           });
//         } else {
//           parts.push({
//             text: compressed[index++] as string,
//             time: compressed[index++] as number,
//             endTime: compressed[index++] as number,
//           });
//         }
//       }

//       allWords.push({ type, index: wordIndex, parts });
//     }

//     lines.push({
//       before: allWords.slice(0, beforeCount),
//       line: allWords.slice(beforeCount, beforeCount + lineCount),
//       after: allWords.slice(beforeCount + lineCount),
//       index: lineIndex,
//     });
//   }

//   return { lines, types };
// }

// export type CompressedLyrics = (string | number)[];
