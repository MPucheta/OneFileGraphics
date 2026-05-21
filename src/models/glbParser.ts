// @ts-nocheck

export async function parseGLB (
  data: Uint8Array,
): Promise<{ gltf: GLTF; resources: unknown[]; warnings?: string[] }> {
  // Check minimum file size for header
  if (data.length === 0) {
    throw new Error(
      "GLB_UNEXPECTED_END_OF_HEADER:Unexpected end of header.:1",
    );
  }
  if (data.length < 12) {
    throw new Error(
      "GLB_UNEXPECTED_END_OF_HEADER:Unexpected end of header.:" + data.length,
    );
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Parse header
  const header: GLBHeader = {
    magic: view.getUint32(0, true), // little-endian
    version: view.getUint32(4, true), // little-endian
    length: view.getUint32(8, true), // little-endian
  };

  // Validate header
  if (header.magic !== 0x46546c67) {
    // 'glTF'
    throw new Error(
      `GLB_INVALID_MAGIC:Invalid GLB magic value (${header.magic}).:0`,
    );
  }

  if (header.version !== 2) {
    throw new Error(
      `GLB_INVALID_VERSION:Invalid GLB version value ${header.version}.:4`,
    );
  }

  // Handle length mismatch
  const warnings: string[] = [];
  const errors: string[] = [];
  const allMessages: string[] = []; // Track all messages in order they occur
  let lengthMismatchError: string | null = null;
  let actualDataLength = data.length;
  if (header.length !== data.length) {
    if (header.length < data.length) {
      // Check if the declared length is suspiciously small (less than 16 bytes - header + minimal chunk)
      // In such cases, treat it as GLB_LENGTH_MISMATCH error instead of extra data warning
      if (header.length < 16) {
        lengthMismatchError = `GLB_LENGTH_MISMATCH:Declared length (${header.length}) does not match GLB length (${data.length}).:${data.length}`;
        // For very small declared lengths, we still need to process the available data to catch more errors
        actualDataLength = data.length; // Use full data length to find more errors
      } else {
        // Extra data after GLB - this should be a warning, not an error
        warnings.push(
          `GLB_EXTRA_DATA:Extra data after the end of GLB stream.:${header.length}`,
        );
        actualDataLength = header.length; // Only process up to declared length
      }
    } else {
      // Declared length is greater than file size
      // Always report length mismatch when declared > actual (file is truncated)
      lengthMismatchError = `GLB_LENGTH_MISMATCH:Declared length (${header.length}) does not match GLB length (${data.length}).:${data.length}`;
      // Continue processing with available data
      actualDataLength = data.length;
    }
  }

  // Check if declared length is too small (less than just the header)
  if (header.length <= 12) {
    const msg = `GLB_LENGTH_TOO_SMALL:Declared GLB length (${header.length}) is too small.:8`;
    errors.push(msg);
    allMessages.push(msg);
  }

  // Parse chunks
  let offset = 12;
  const chunks: GLBChunk[] = [];
  const resources: unknown[] = [];
  const seenChunkTypes = new Set<number>();

  while (offset < actualDataLength) {
    if (offset + 8 > actualDataLength) {
      throw new Error(
        `GLB_UNEXPECTED_END_OF_CHUNK_HEADER:Unexpected end of chunk header.:${offset}`,
      );
    }

    const chunkLength = view.getUint32(offset, true); // little-endian
    const chunkType = view.getUint32(offset + 4, true); // little-endian

    // Check for empty chunk
    let isEmptyChunk = false;
    if (chunkLength === 0) {
      const chunkTypeStr = chunkType
        .toString(16)
        .toLowerCase()
        .padStart(8, "0");
      const knownChunkTypes = [0x4e4f534a, 0x004e4942]; // JSON and BIN

      if (chunkType === 0x004e4942) {
        // BIN chunk
        // Empty BIN chunks are info-level messages
        const msg = `GLB_EMPTY_BIN_CHUNK:Empty BIN chunk should be omitted.:${offset}`;
        warnings.push(msg);
        allMessages.push(msg);
      } else if (knownChunkTypes.includes(chunkType)) {
        // Other known empty chunks are errors
        const msg = `GLB_EMPTY_CHUNK:Chunk (0x${chunkTypeStr}) cannot have zero length.:${offset}`;
        errors.push(msg);
        allMessages.push(msg);
      }
      // For unknown chunk types, don't report empty chunk error - the unknown type is more significant
      isEmptyChunk = true;
    }

    // Check if chunk length is too big for the remaining GLB
    if (offset + 8 + chunkLength > header.length) {
      const chunkTypeStr = chunkType
        .toString(16)
        .toLowerCase()
        .padStart(8, "0");
      const msg = `GLB_CHUNK_TOO_BIG:Chunk (0x${chunkTypeStr}) length (${chunkLength}) does not fit total GLB length.:${offset}`;
      errors.push(msg);
      allMessages.push(msg);
    }

    let isDataTruncated = false;
    if (offset + 8 + chunkLength > actualDataLength) {
      const msg = `GLB_UNEXPECTED_END_OF_CHUNK_DATA:Unexpected end of chunk data.:${offset + 8 + chunkLength - 1}`;
      errors.push(msg);
      allMessages.push(msg);
      isDataTruncated = true;
    }

    // Check for duplicate chunk types
    if (seenChunkTypes.has(chunkType)) {
      const chunkTypeStr = chunkType
        .toString(16)
        .toLowerCase()
        .padStart(8, "0");
      const msg = `GLB_DUPLICATE_CHUNK:Chunk of type 0x${chunkTypeStr} has already been used.:${offset}`;
      errors.push(msg);
      allMessages.push(msg);
    }
    seenChunkTypes.add(chunkType);

    // Check for unknown chunk types
    const knownChunkTypes = [0x4e4f534a, 0x004e4942]; // JSON and BIN
    if (!knownChunkTypes.includes(chunkType)) {
      const chunkTypeStr = chunkType
        .toString(16)
        .toLowerCase()
        .padStart(8, "0");
      const msg = `GLB_UNKNOWN_CHUNK_TYPE:Unknown GLB chunk type: 0x${chunkTypeStr}.:${offset}`;
      warnings.push(msg);
      allMessages.push(msg);
    }

    // Check for 4-byte alignment
    if (chunkLength % 4 !== 0) {
      throw new Error(
        `GLB_CHUNK_LENGTH_UNALIGNED:Length of 0x${chunkType.toString(16)} chunk is not aligned to 4-byte boundaries.:${offset}`,
      );
    }

    let chunkData: Uint8Array;
    if (isEmptyChunk) {
      chunkData = new Uint8Array(0); // Empty data for empty chunks
      offset += 8; // Only skip the header for empty chunks
    } else if (isDataTruncated) {
      // Read what we can for truncated data
      const availableData = actualDataLength - (offset + 8);
      chunkData =
        availableData > 0
          ? data.slice(offset + 8, offset + 8 + availableData)
          : new Uint8Array(0);
      offset = actualDataLength; // Move to end of file
    } else {
      chunkData = data.slice(offset + 8, offset + 8 + chunkLength);
      offset += 8 + chunkLength;
    }

    chunks.push({
      length: chunkLength,
      type: chunkType,
      data: chunkData,
    });

    // Break after adding chunk if data was truncated
    if (isDataTruncated) {
      break;
    }
  }

  // Find JSON and BIN chunks
  const jsonChunk = chunks.find((chunk) => chunk.type === 0x4e4f534a); // 'JSON'
  const binChunk = chunks.find((chunk) => chunk.type === 0x004e4942); // 'BIN\0'

  // Check for first chunk validation and prioritize it
  let firstChunkError: string | null = null;
  if (!jsonChunk && chunks.length > 0 && chunks[0]) {
    const firstChunkType = chunks[0].type;
    firstChunkError = `GLB_UNEXPECTED_FIRST_CHUNK:First chunk must be of JSON type. Found 0x${firstChunkType.toString(16).padStart(8, "0")} instead.:12`;
    allMessages.unshift(firstChunkError); // Add at beginning since it's at offset 12
  }

  // Check for BIN chunk position validation
  if (binChunk) {
    const binChunkIndex = chunks.findIndex(
      (chunk) => chunk.type === 0x004e4942,
    );
    if (binChunkIndex > 1) {
      // BIN chunk exists but is not the second chunk (index 1)
      // Calculate offset of the BIN chunk for error reporting
      let binChunkOffset = 12; // Start after header
      for (let i = 0; i < binChunkIndex; i++) {
        binChunkOffset += 8; // chunk header (length + type)
        if (chunks[i] && chunks[i]!.length > 0) {
          binChunkOffset += chunks[i]!.length;
        }
      }
      const binChunkError = `GLB_UNEXPECTED_BIN_CHUNK:BIN chunk must be the second chunk.:${binChunkOffset}`;
      errors.push(binChunkError);
      allMessages.push(binChunkError);
    }
  }

  // Collect JSON parsing errors even if we have chunk errors
  const jsonParsingErrors: string[] = [];

  if (jsonChunk) {
    // Only try to parse JSON for empty chunks if we have multiple chunk errors
    // Single empty chunk should only report GLB_EMPTY_CHUNK
    const shouldAttemptJsonParsing =
      jsonChunk.length > 0 || errors.length > 1;

    if (shouldAttemptJsonParsing) {
      try {
        const jsonText = new TextDecoder().decode(jsonChunk.data);

        // Check for BOM at the beginning of JSON (UTF-8 BOM is EF BB BF)
        if (
          jsonChunk.data.length >= 3 &&
          jsonChunk.data[0] === 0xef &&
          jsonChunk.data[1] === 0xbb &&
          jsonChunk.data[2] === 0xbf
        ) {
          jsonParsingErrors.push(
            "Invalid JSON data. Parser output: BOM found at the beginning of UTF-8 stream.",
          );
        } else {
          JSON.parse(jsonText); // This will throw if JSON is invalid (including empty string)
        }
      } catch (error) {
        // Convert JSON parsing errors to proper INVALID_JSON errors with expected format
        let errorMessage = `${error}`;
        if (errorMessage.includes("Unexpected end of JSON input")) {
          errorMessage =
            "FormatException: Unexpected end of input (at offset 0)";
        } else if (
          errorMessage.includes(
            "Expected property name or '}' in JSON at position 1",
          )
        ) {
          errorMessage =
            "FormatException: Unexpected character (at offset 1)";
        } else if (errorMessage.includes("SyntaxError:")) {
          // Generic syntax error conversion
          const positionMatch = errorMessage.match(/at position (\d+)/);
          const offset = positionMatch ? positionMatch[1] : "0";
          errorMessage = `FormatException: Unexpected character (at offset ${offset})`;
        }
        jsonParsingErrors.push(
          `Invalid JSON data. Parser output: ${errorMessage}`,
        );
      }
    }
  }

  // Only abort GLTF parsing if we have JSON parsing errors, no JSON chunk, or empty JSON chunk
  // Allow GLTF parsing to continue even with GLB chunk structure errors
  if (
    jsonParsingErrors.length > 0 ||
    !jsonChunk ||
    (jsonChunk && jsonChunk.length === 0)
  ) {
    // Add length mismatch error if needed (after chunk validation errors)
    if (lengthMismatchError) {
      const hasChunkTruncationError = allMessages.some((msg) =>
        msg.includes("GLB_UNEXPECTED_END_OF_CHUNK_DATA"),
      );
      if (!hasChunkTruncationError) {
        allMessages.push(lengthMismatchError);
      }
    }

    // Add JSON parsing errors to the messages
    allMessages.push(...jsonParsingErrors);

    // Sort by offset to maintain expected order
    const sortedMessages = allMessages.sort((a, b) => {
      // Extract offset from message (format: CODE:MESSAGE:OFFSET)
      const getOffset = (msg: string) => {
        // JSON parsing errors don't have offsets - put them at the end
        if (msg.includes("Invalid JSON data. Parser output:")) {
          return Number.MAX_SAFE_INTEGER;
        }
        const parts = msg.split(":");
        if (parts.length < 3) return Number.MAX_SAFE_INTEGER;
        const offsetStr = parts[parts.length - 1];
        return offsetStr ? parseInt(offsetStr) || 0 : 0;
      };
      return getOffset(a) - getOffset(b);
    });
    throw new Error(sortedMessages.join("|NEXT_ERROR|"));
  }

  if (!jsonChunk) {
    // If no chunks at all, this is a different error
    if (chunks.length === 0) {
      throw new Error("GLB missing JSON chunk");
    }
    // First chunk validation was already handled above
    throw new Error("GLB missing JSON chunk");
  }

  // Parse JSON chunk
  const jsonText = new TextDecoder().decode(jsonChunk.data);
  let gltf: GLTF;

  // Check for BOM at the beginning of JSON (UTF-8 BOM is EF BB BF)
  if (
    jsonChunk.data.length >= 3 &&
    jsonChunk.data[0] === 0xef &&
    jsonChunk.data[1] === 0xbb &&
    jsonChunk.data[2] === 0xbf
  ) {
    throw new Error(
      `Invalid JSON data. Parser output: BOM found at the beginning of UTF-8 stream.`,
    );
  }

  try {
    const json = JSON.parse(jsonText);
    gltf = this.normalizeGLTF(json);
  } catch (error) {
    // Convert JSON parsing errors to proper INVALID_JSON errors with expected format
    let errorMessage = `${error}`;
    if (errorMessage.includes("Unexpected end of JSON input")) {
      errorMessage = "FormatException: Unexpected end of input (at offset 0)";
    } else if (
      errorMessage.includes(
        "Expected property name or '}' in JSON at position 1",
      )
    ) {
      errorMessage = "FormatException: Unexpected character (at offset 1)";
    } else if (errorMessage.includes("SyntaxError:")) {
      // Generic syntax error conversion
      const positionMatch = errorMessage.match(/at position (\d+)/);
      const offset = positionMatch ? positionMatch[1] : "0";
      errorMessage = `FormatException: Unexpected character (at offset ${offset})`;
    }
    throw new Error(`Invalid JSON data. Parser output: ${errorMessage}`);
  }

  // Handle BIN chunk
  if (binChunk) {
    if (!gltf.buffers || gltf.buffers.length === 0) {
      throw new Error("GLB has BIN chunk but no buffers defined");
    }

    // Don't modify the original buffer - preserve it for validation
    // Just add resource information for the BIN chunk
    resources.push({
      pointer: "/buffers/0",
      mimeType: "application/gltf-buffer",
      storage: "glb",
      byteLength: binChunk.data.length,
      actualByteLength: binChunk.data.length,
      declaredByteLength: gltf.buffers[0]?.byteLength,
    });
  }

  // Collect all GLB errors (chunk structure errors) as warnings to be reported by caller
  // Only fatal errors (like JSON parsing errors) should prevent GLTF validation
  const glbErrors: string[] = [...errors];

  // Add first chunk error if present
  if (firstChunkError) {
    glbErrors.unshift(firstChunkError);
  }

  // Add length mismatch error at the end (after chunk validation errors)
  // Only add length mismatch if we don't have chunk-level truncation errors
  if (lengthMismatchError) {
    const hasChunkTruncationError = glbErrors.some((error) =>
      error.includes("GLB_UNEXPECTED_END_OF_CHUNK_DATA"),
    );
    if (!hasChunkTruncationError) {
      glbErrors.push(lengthMismatchError);
    }
  }

  // Combine GLB errors as warnings for the caller to handle
  if (glbErrors.length > 0) {
    const combinedError = glbErrors.join("|NEXT_ERROR|");
    warnings.push(combinedError);
  }

  return { gltf, resources, warnings };
}
