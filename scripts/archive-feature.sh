#!/bin/bash
# scripts/archive-feature.sh
# Purpose: Archive completed PDCA documents (v1.3.0)
# Usage: archive-feature.sh <feature-name>
# Creates: docs/archive/YYYY-MM/{feature}/
# Moves: plan, design, analysis, report docs to archive
# Updates: docs/archive/YYYY-MM/_INDEX.md

set -e

# Get feature name from argument
FEATURE="$1"

if [ -z "$FEATURE" ]; then
    echo "Usage: archive-feature.sh <feature-name>"
    echo "Example: archive-feature.sh login"
    exit 1
fi

# Set up paths
ARCHIVE_DATE=$(date +%Y-%m)
ARCHIVE_DIR="docs/archive/${ARCHIVE_DATE}/${FEATURE}"

# Document paths to check
PLAN_DOC="docs/01-plan/features/${FEATURE}.plan.md"
DESIGN_DOC="docs/02-design/features/${FEATURE}.design.md"
ANALYSIS_DOC="docs/03-analysis/${FEATURE}.analysis.md"
REPORT_DOC="docs/04-report/${FEATURE}.report.md"

# Also check for alternative naming patterns
ANALYSIS_ALT="docs/03-analysis/${FEATURE}.gap-analysis.md"
REPORT_ALT="docs/04-report/${FEATURE}.completion-report.md"

# Count existing documents
DOC_COUNT=0
[ -f "$PLAN_DOC" ] && ((DOC_COUNT++)) || true
[ -f "$DESIGN_DOC" ] && ((DOC_COUNT++)) || true
[ -f "$ANALYSIS_DOC" ] && ((DOC_COUNT++)) || [ -f "$ANALYSIS_ALT" ] && ((DOC_COUNT++)) || true
[ -f "$REPORT_DOC" ] && ((DOC_COUNT++)) || [ -f "$REPORT_ALT" ] && ((DOC_COUNT++)) || true

if [ "$DOC_COUNT" -eq 0 ]; then
    echo "Error: No PDCA documents found for feature '${FEATURE}'"
    echo ""
    echo "Checked paths:"
    echo "  - $PLAN_DOC"
    echo "  - $DESIGN_DOC"
    echo "  - $ANALYSIS_DOC"
    echo "  - $REPORT_DOC"
    exit 1
fi

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Move documents with logging
MOVED_DOCS=()

if [ -f "$PLAN_DOC" ]; then
    mv "$PLAN_DOC" "$ARCHIVE_DIR/"
    MOVED_DOCS+=("plan.md")
fi

if [ -f "$DESIGN_DOC" ]; then
    mv "$DESIGN_DOC" "$ARCHIVE_DIR/"
    MOVED_DOCS+=("design.md")
fi

if [ -f "$ANALYSIS_DOC" ]; then
    mv "$ANALYSIS_DOC" "$ARCHIVE_DIR/"
    MOVED_DOCS+=("analysis.md")
elif [ -f "$ANALYSIS_ALT" ]; then
    mv "$ANALYSIS_ALT" "$ARCHIVE_DIR/"
    MOVED_DOCS+=("gap-analysis.md")
fi

if [ -f "$REPORT_DOC" ]; then
    mv "$REPORT_DOC" "$ARCHIVE_DIR/"
    MOVED_DOCS+=("report.md")
elif [ -f "$REPORT_ALT" ]; then
    mv "$REPORT_ALT" "$ARCHIVE_DIR/"
    MOVED_DOCS+=("completion-report.md")
fi

# Update archive index
INDEX_FILE="docs/archive/${ARCHIVE_DATE}/_INDEX.md"
if [ ! -f "$INDEX_FILE" ]; then
    mkdir -p "docs/archive/${ARCHIVE_DATE}"
    cat > "$INDEX_FILE" << EOF
# Archive - ${ARCHIVE_DATE}

완료된 PDCA 문서 아카이브입니다.

| Feature | Archived Date | Status | Documents |
|---------|---------------|--------|-----------|
EOF
fi

# Add entry to index
DOC_LIST=$(IFS=', '; echo "${MOVED_DOCS[*]}")
echo "| ${FEATURE} | $(date +%Y-%m-%d) | Completed | ${DOC_LIST} |" >> "$INDEX_FILE"

# Output result
echo "✅ Archived: ${FEATURE}"
echo ""
echo "📁 Location: ${ARCHIVE_DIR}"
echo "📄 Documents moved: ${#MOVED_DOCS[@]}"
for doc in "${MOVED_DOCS[@]}"; do
    echo "   - ${doc}"
done
echo ""
echo "📋 Index updated: ${INDEX_FILE}"
