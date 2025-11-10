#!/bin/bash

###############################################################################
# Transpose Audio File Generator
# Uses Rubber Band CLI to generate high-quality pitched versions
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if rubberband is installed
if ! command -v rubberband &> /dev/null; then
    echo -e "${RED}Error: rubberband CLI is not installed${NC}"
    echo -e "${YELLOW}Install it with:${NC}"
    echo -e "  ${BLUE}brew install rubberband${NC}"
    echo ""
    exit 1
fi

# Configuration
INPUT_DIR="./public/audio"
OUTPUT_DIR="./public/audio/pitched"
MIN_PITCH=-6
MAX_PITCH=6

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Transpose - Pitched Audio Generator          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Find all MP3 files in input directory (but not already pitched ones)
shopt -s nullglob
mp3_files=("$INPUT_DIR"/*.mp3)

if [ ${#mp3_files[@]} -eq 0 ]; then
    echo -e "${RED}No MP3 files found in $INPUT_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}Found ${#mp3_files[@]} MP3 file(s) to process${NC}"
echo ""

# Process each MP3 file
for input_file in "${mp3_files[@]}"; do
    # Get filename without extension
    filename=$(basename "$input_file" .mp3)
    
    # Skip if this looks like an already pitched file
    if [[ "$filename" =~ _[+-][0-9]+$ ]] || [[ "$filename" =~ _original$ ]]; then
        echo -e "${YELLOW}Skipping already pitched file: $filename${NC}"
        continue
    fi
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Processing: ${BLUE}$filename.mp3${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Copy original as the "0" pitch version
    echo -e "${YELLOW}[0/13]${NC} Creating original (0 semitones)..."
    cp "$input_file" "$OUTPUT_DIR/${filename}_0.mp3"
    
    # Generate all pitched versions
    counter=1
    for pitch in $(seq $MIN_PITCH $MAX_PITCH); do
        # Skip 0 since we already copied it
        if [ $pitch -eq 0 ]; then
            continue
        fi
        
        # Format pitch with sign
        if [ $pitch -gt 0 ]; then
            pitch_str="+${pitch}"
        else
            pitch_str="${pitch}"
        fi
        
        output_file="$OUTPUT_DIR/${filename}_${pitch_str}.mp3"
        
        echo -e "${YELLOW}[${counter}/13]${NC} Generating ${pitch_str} semitones..."
        
        # Run rubberband with high-quality settings
        rubberband \
            --pitch $pitch \
            --crisp 5 \
            --formant \
            --threads \
            "$input_file" \
            "$output_file" 2>/dev/null
        
        ((counter++))
    done
    
    echo -e "${GREEN}✓ Completed: $filename (13 versions)${NC}"
    echo ""
done

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Processing Complete!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Output directory:${NC} $OUTPUT_DIR"
echo -e "${BLUE}Total files generated:${NC} $(ls -1 "$OUTPUT_DIR"/*.mp3 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review the generated files in: ${BLUE}$OUTPUT_DIR${NC}"
echo -e "  2. Refresh your browser to use the new high-quality pitch shifting"
echo ""

