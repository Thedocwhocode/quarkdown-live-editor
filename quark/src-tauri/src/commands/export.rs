/// Commands for exporting notes to plain-text formats.
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

/// Result returned by an export operation.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub success: bool,
    /// Absolute path to the written file, present on success.
    pub path: Option<String>,
    /// Human-readable error message, present on failure.
    pub error: Option<String>,
}

/// Exports a note's source to a plain `.txt` file at `output_path`.
///
/// Quarkdown markup is stripped before writing: function calls (`.name …`)
/// are removed, `{` and `}` delimiters are replaced with spaces, and leading
/// `#` heading markers are stripped so only the heading text is preserved.
#[tauri::command]
pub fn export_note_txt(
    state: State<'_, AppState>,
    id: String,
    output_path: String,
) -> Result<ExportResult, String> {
    // Fetch the source document from the database.
    let source: String = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.query_row(
            "SELECT source_qd FROM notes WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?
    };

    let plain = strip_quarkdown_markup(&source);

    match std::fs::write(&output_path, plain) {
        Ok(()) => Ok(ExportResult {
            success: true,
            path: Some(output_path),
            error: None,
        }),
        Err(e) => Ok(ExportResult {
            success: false,
            path: None,
            error: Some(e.to_string()),
        }),
    }
}

/// Strips Quarkdown-specific markup from a source string, returning readable plain text.
///
/// The following transformations are applied line by line and token by token:
/// - Lines starting with `.` followed by an identifier are treated as function calls and skipped entirely.
/// - Leading `#` characters (Markdown headings) are removed, keeping only the heading text.
/// - `{` and `}` delimiters are replaced with a single space.
fn strip_quarkdown_markup(source: &str) -> String {
    let mut output = String::with_capacity(source.len());

    for line in source.lines() {
        let trimmed = line.trim_start();

        // Skip block-level function call lines (e.g. `.funcname {arg}`).
        if is_function_call_line(trimmed) {
            continue;
        }

        // Strip leading '#' heading markers.
        let without_heading = trimmed.trim_start_matches('#').trim_start();

        // Replace '{' and '}' with spaces and collapse inline function tokens.
        let cleaned = remove_inline_functions(without_heading);

        output.push_str(&cleaned);
        output.push('\n');
    }

    output.trim_end().to_string()
}

/// Returns `true` if the line is a Quarkdown block function call.
///
/// A block function call starts with `.` immediately followed by an ASCII letter.
fn is_function_call_line(line: &str) -> bool {
    let mut chars = line.chars();
    matches!((chars.next(), chars.next()), (Some('.'), Some(c)) if c.is_ascii_alphabetic())
}

/// Removes inline `.functionname` tokens and replaces `{`/`}` with spaces.
fn remove_inline_functions(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            // Inline function token: skip `.` and the following identifier.
            '.' if chars.peek().map_or(false, |c| c.is_ascii_alphabetic()) => {
                // Consume the identifier characters.
                while chars.peek().map_or(false, |c| c.is_alphanumeric() || *c == '_' || *c == '-') {
                    chars.next();
                }
            }
            '{' | '}' => result.push(' '),
            other => result.push(other),
        }
    }

    // Collapse runs of whitespace introduced by the replacements.
    collapse_whitespace(&result)
}

/// Collapses consecutive whitespace characters (excluding newlines) into a single space.
fn collapse_whitespace(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut prev_space = false;

    for ch in s.chars() {
        if ch == ' ' || ch == '\t' {
            if !prev_space {
                result.push(' ');
            }
            prev_space = true;
        } else {
            result.push(ch);
            prev_space = false;
        }
    }

    result.trim_end().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_function_call_lines() {
        let src = ".doctype {plain}\nHello world\n.foo {bar}";
        let out = strip_quarkdown_markup(src);
        assert_eq!(out, "Hello world");
    }

    #[test]
    fn strips_heading_markers() {
        let src = "## Section Title";
        let out = strip_quarkdown_markup(src);
        assert_eq!(out, "Section Title");
    }

    #[test]
    fn replaces_braces_with_spaces() {
        let src = "Some {value} here";
        let out = strip_quarkdown_markup(src);
        assert_eq!(out, "Some  value  here");
    }

    #[test]
    fn removes_inline_function_tokens() {
        let src = "Hello .bold {world} today";
        let out = strip_quarkdown_markup(src);
        assert_eq!(out, "Hello  world  today");
    }
}
