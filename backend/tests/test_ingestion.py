from pathlib import Path

from app.services.ingestion import ParsedBlock, build_sections, chunk_blocks, parse_text


def test_build_sections_preserves_content_and_page_ranges() -> None:
    blocks = [
        ParsedBlock("Preface", page=1, position=0),
        ParsedBlock("First chapter", page=2, position=1, kind="heading", level=1),
        ParsedBlock("First paragraph", page=2, position=2),
        ParsedBlock("Details", page=3, position=3, kind="heading", level=2),
        ParsedBlock("Second paragraph", page=4, position=4),
    ]

    sections = build_sections(blocks)

    assert [section.title for section in sections] == ["Introduction", "First chapter", "Details"]
    assert [section.content for section in sections] == [
        "Preface",
        "First paragraph",
        "Second paragraph",
    ]
    assert (sections[2].page_start, sections[2].page_end) == (3, 4)
    assert chunk_blocks(sections[2].blocks)[0].text == "Second paragraph"


def test_build_sections_preserves_pdf_pages_without_headings() -> None:
    blocks = [
        ParsedBlock("Page one", page=1, position=0),
        ParsedBlock("More page one", page=1, position=1),
        ParsedBlock("Page two", page=2, position=2),
    ]

    sections = build_sections(blocks)

    assert [section.title for section in sections] == ["Page 1", "Page 2"]
    assert sections[0].content == "Page one\n\nMore page one"
    assert sections[1].content == "Page two"


def test_parse_text_tracks_repeated_paragraph_locations(tmp_path: Path) -> None:
    document = tmp_path / "repeated.txt"
    document.write_text("Repeated paragraph.\n\nMiddle.\n\nRepeated paragraph.", encoding="utf-8")

    blocks, page_count = parse_text(document)

    assert page_count == 1
    assert [block.source_location["line_start"] for block in blocks] == [1, 3, 5]
