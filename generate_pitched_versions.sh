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
    
    # Check if all pitched versions already exist
    all_exist=true
    for pitch in $(seq $MIN_PITCH $MAX_PITCH); do
        if [ $pitch -gt 0 ]; then
            pitch_str="+${pitch}"
        else
            pitch_str="${pitch}"
        fi
        output_file="$OUTPUT_DIR/${filename}_${pitch_str}.mp3"
        if [ ! -f "$output_file" ]; then
            all_exist=false
            break
        fi
    done
    
    # If all versions exist, skip this file
    if [ "$all_exist" = true ]; then
        echo -e "${YELLOW}⏭️  All 13 versions already exist - skipping${NC}"
        echo ""
        continue
    fi
    
    # Copy original as the "0" pitch version (if doesn't exist)
    if [ ! -f "$OUTPUT_DIR/${filename}_0.mp3" ]; then
        echo -e "${YELLOW}[0/13]${NC} Creating original (0 semitones)..."
        cp "$input_file" "$OUTPUT_DIR/${filename}_0.mp3"
    else
        echo -e "${BLUE}[0/13]${NC} Original already exists - skipping"
    fi
    
    # Generate all pitched versions
    counter=1
    generated=0
    skipped=0
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
        
        # Check if this version already exists
        if [ -f "$output_file" ]; then
            echo -e "${BLUE}[${counter}/12]${NC} ${pitch_str} semitones already exists - skipping"
            ((skipped++))
        else
            echo -e "${YELLOW}[${counter}/12]${NC} Generating ${pitch_str} semitones..."
            
            # Run rubberband with high-quality settings
            rubberband \
                --pitch $pitch \
                --crisp 5 \
                --formant \
                --threads \
                "$input_file" \
                "$output_file" 2>/dev/null
            
            ((generated++))
        fi
        
        ((counter++))
    done
    
    if [ $generated -gt 0 ]; then
        echo -e "${GREEN}✓ Completed: $filename (${generated} new, ${skipped} skipped)${NC}"
    else
        echo -e "${GREEN}✓ All versions already existed for: $filename${NC}"
    fi
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

