/**
 * TitleBar and sub-components for the Google Docs-style 2-level toolbar.
 *
 * - TitleBar: two-row layout (row 1: logo + doc name + right actions, row 2: menu bar)
 * - Logo: renders custom logo content left-aligned
 * - DocumentName: editable document name input
 * - MenuBar: File/Format/Insert menus (auto-wired from EditorToolbarContext)
 * - TitleBarRight: right-aligned actions slot
 */

import React, { useCallback, useState, Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { MenuDropdown, SubMenuItem } from './ui/MenuDropdown';
import type { MenuEntry } from './ui/MenuDropdown';
import { MenuBarProvider } from './ui/MenuBarContext';
import { MaterialSymbol } from './ui/Icons';
import { Tooltip } from './ui/Tooltip';
import { TableGridInline } from './ui/TableGridInline';
import { WriterStatusPill } from './WriterStatusPill';
import { useEditorToolbar } from './EditorToolbarContext';
import type { FormattingAction } from './Toolbar';
import { useTranslation } from '../i18n';
import { openReportIssue } from './reportIssue';

// ============================================================================
// Logo
// ============================================================================

export interface LogoProps {
  children: ReactNode;
}

export function Logo({ children }: LogoProps) {
  return <div className="flex items-center flex-shrink-0">{children}</div>;
}

// ============================================================================
// DocumentName
// ============================================================================

export interface DocumentNameProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}

function stripExtension(name: string): string {
  return name.replace(/\.docx$/i, '');
}

export function DocumentName({ value, onChange, placeholder, editable = true }: DocumentNameProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('titleBar.untitled');
  const displayName = stripExtension(value) ?? '';
  const [focused, setFocused] = useState(false);

  if (!editable) {
    return (
      <span className="text-base font-normal text-[color:var(--doc-text-on-surface,#1f2937)] px-2 py-0 min-w-[100px] max-w-[360px] truncate leading-tight">
        {displayName || resolvedPlaceholder}
      </span>
    );
  }
  // Google Docs-style auto-sizing title field. An invisible sizer mirrors the
  // text so the field hugs short names and grows up to the max width for long
  // ones; past the cap the input scrolls horizontally. The ellipsis ("…") is a
  // CSS affordance only when the field is *not* focused — while editing or
  // renaming, the full name is always shown (and remains the real value), so a
  // truncated display never gets mistaken for a truncated name.
  const sizerText = displayName || resolvedPlaceholder;
  return (
    <span className="relative inline-flex items-center min-w-[100px] max-w-[360px] leading-tight">
      <span aria-hidden className="invisible whitespace-pre px-2 text-base font-normal">
        {sizerText || ' '}
      </span>
      <input
        type="text"
        value={displayName}
        onChange={(e) => {
          const raw = e.target.value;
          onChange?.(raw.endsWith('.docx') ? raw : raw + '.docx');
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={resolvedPlaceholder}
        className={`absolute inset-0 w-full text-base font-normal text-[color:var(--doc-text-on-surface,#1f2937)] bg-transparent border-0 outline-none px-2 py-0 rounded hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] focus:bg-[color:var(--doc-surface,white)] focus:ring-1 focus:ring-slate-300 leading-tight ${focused ? '' : 'truncate'}`}
        aria-label={t('titleBar.documentNameAriaLabel')}
      />
    </span>
  );
}

// ============================================================================
// TitleBarRight
// ============================================================================

export interface TitleBarRightProps {
  children: ReactNode;
}

export function TitleBarRight({ children }: TitleBarRightProps) {
  return (
    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
      <WriterStatusPillSlot />
      <SaveStatusIndicator />
      <ThemeToggleButton />
      {children}
    </div>
  );
}

// ============================================================================
// WriterStatusPillSlot — bridges the Writing Assistant controller into
// the title bar. Renders nothing when the assistant has no enabled
// features (avoids visual clutter for users who haven't opted in);
// otherwise shows a click-to-open pill that surfaces the current
// load / busy / ready state across every screen, not just inside the
// Writing Assistant sheet.
// ============================================================================
function WriterStatusPillSlot() {
  const ctx = useEditorToolbar();
  const { onOpenWritingAssistant } = ctx;
  if (!onOpenWritingAssistant) return null;
  return <WriterStatusPill onClick={onOpenWritingAssistant} />;
}

// ============================================================================
// SaveStatusIndicator — shows "Saving…" while a save is in flight, then
// a "•" dot when there are unsaved edits, then nothing when clean.
// Wired from the host through ToolbarProps.isDirty / isSaving via the
// EditorToolbar context.
// ============================================================================

function SaveStatusIndicator() {
  const ctx = useEditorToolbar();
  const { isDirty, isSaving } = ctx;
  if (isSaving) {
    return (
      <span
        className="text-xs text-[color:var(--doc-text-on-surface-muted,#5f6368)] flex items-center gap-1"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            border: '1.5px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'docx-spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
        Saving…
      </span>
    );
  }
  if (isDirty) {
    return (
      <span
        className="text-xs text-[color:var(--doc-text-on-surface-muted,#5f6368)]"
        title="Unsaved changes"
        aria-label="Unsaved changes"
      >
        Unsaved changes
      </span>
    );
  }
  return (
    <span
      className="text-xs text-[color:var(--doc-text-on-surface-muted,#5f6368)]"
      aria-live="polite"
    >
      All changes saved
    </span>
  );
}

// ============================================================================
// ThemeToggleButton — sun/moon/auto icon in the top-right that cycles
// through auto → light → dark. Hidden when the host doesn't wire
// onSetColorTheme. Renders inside TitleBarRight so it's always visible
// in the same spot as Share / status indicators.
// ============================================================================

function ThemeToggleButton() {
  const ctx = useEditorToolbar();
  const { onSetColorTheme, colorTheme } = ctx;
  if (!onSetColorTheme) return null;
  const current = colorTheme ?? 'auto';
  const next: 'light' | 'dark' | 'auto' =
    current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
  const icon = current === 'dark' ? 'dark_mode' : current === 'light' ? 'light_mode' : 'contrast';
  const title =
    current === 'auto'
      ? 'Theme: match system (click for light)'
      : current === 'light'
        ? 'Theme: light (click for dark)'
        : 'Theme: dark (click for auto)';
  return (
    <Tooltip content={title}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onSetColorTheme(next)}
        aria-label={title}
        className="flex items-center justify-center w-8 h-8 rounded hover:bg-[color:var(--doc-bg-hover,#f1f3f4)] text-[color:var(--doc-text-on-surface,#1f2937)]"
      >
        <MaterialSymbol name={icon} size={18} />
      </button>
    </Tooltip>
  );
}

// ============================================================================
// MenuBar
// ============================================================================

export function MenuBar() {
  const { t } = useTranslation();
  const ctx = useEditorToolbar();
  const {
    disabled = false,
    onFormat,
    onPrint,
    showPrintButton = true,
    onNew,
    onOpen,
    onSave,
    onMakeCopy,
    onEmailAsAttachment,
    onPageSetup,
    onFileProperties,
    onExportPdf,
    onExportOdt,
    onExportMd,
    onExportTxt,
    onReportBug,
    onShowAbout,
    onOpenCommandPalette,
    onOpenKeyboardShortcuts,
    onOpenPreferences,
    onOpenWatermark,
    onOpenAccessibility,
    onOpenBuildingBlocks,
    onConvertSelectionToTable,
    onConvertTableToText,
    onOpenDictionary,
    onOpenTranslate,
    onTranslateDocument,
    onToggleSpellcheck,
    spellcheckEnabled,
    onOpenWritingAssistant,
    onOpenExplore,
    onOpenCitations,
    onInsertShape,
    onInsertTextBox,
    onSetColorTheme,
    colorTheme,
    zoom,
    onZoomChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onOpenFind,
    onOpenFindReplace,
    onOpenWordCount,
    onToggleVoiceTyping,
    voiceTypingActive,
    onToggleSpellCheck,
    spellCheckEnabled,
    currentFormatting,
    onInsertImage,
    onInsertTable,
    showTableInsert = true,
    onInsertPageBreak,
    onInsertSectionBreak,
    onInsertField,
    onInsertTOC,
    onOpenBookmarks,
    onOpenParagraphDialog,
    onOpenBordersShading,
    onInsertHorizontalRule,
    onOpenInsertSymbol,
    onInsertFootnote,
    onToggleShowRuler,
    rulerVisible,
    onToggleShowFormattingMarks,
    showFormattingMarks,
    onToggleOutline,
    outlineVisible,
    onRefocusEditor,
  } = ctx;

  const handleFormat = useCallback(
    (action: FormattingAction) => {
      if (!disabled && onFormat) onFormat(action);
    },
    [disabled, onFormat]
  );

  const handleTableInsert = useCallback(
    (rows: number, columns: number) => {
      if (!disabled && onInsertTable) {
        onInsertTable(rows, columns);
        requestAnimationFrame(() => onRefocusEditor?.());
      }
    },
    [disabled, onInsertTable, onRefocusEditor]
  );

  const hasPrintOrPageSetup = (showPrintButton && onPrint) || onPageSetup;
  const hasExport = onExportPdf || onExportOdt || onExportMd || onExportTxt;
  const hasFileMenu =
    hasPrintOrPageSetup || onNew || onOpen || onSave || onMakeCopy ||
    onEmailAsAttachment || onFileProperties || hasExport;

  const sep = { type: 'separator' as const } as MenuEntry;

  return (
    <MenuBarProvider>
      <div
        className="flex items-center overflow-x-auto whitespace-nowrap min-w-0"
        style={{ scrollbarWidth: 'none' }}
        role="toolbar"
        aria-label={t('titleBar.menuBarAriaLabel')}
      >
        {/* ── File ── */}
        {hasFileMenu && (
          <MenuDropdown
            label={t('toolbar.file')}
            disabled={disabled}
            items={[
              ...(onNew ? [{ icon: 'note_add', label: 'New', shortcut: 'Ctrl+N', onClick: onNew } as MenuEntry] : []),
              ...(onOpen ? [{ icon: 'file_upload', label: t('toolbar.open'), shortcut: t('toolbar.openShortcut'), onClick: onOpen } as MenuEntry] : []),
              ...(onSave ? [{ icon: 'file_download', label: t('toolbar.save'), shortcut: t('toolbar.saveShortcut'), onClick: onSave } as MenuEntry] : []),
              ...(onMakeCopy ? [{ icon: 'content_copy', label: t('toolbar.makeCopy'), onClick: onMakeCopy } as MenuEntry] : []),
              ...(onEmailAsAttachment ? [{ label: t('toolbar.emailAsAttachment'), onClick: onEmailAsAttachment } as MenuEntry] : []),
              ...((onNew || onOpen || onSave || onMakeCopy || onEmailAsAttachment) && (hasPrintOrPageSetup || onFileProperties || hasExport) ? [sep] : []),
              ...(showPrintButton && onPrint ? [{ icon: 'print', label: t('toolbar.print'), shortcut: t('toolbar.printShortcut'), onClick: onPrint } as MenuEntry] : []),
              ...(onExportPdf ? [{ icon: 'file_download', label: 'Export as PDF', onClick: onExportPdf } as MenuEntry] : []),
              ...(onExportOdt ? [{ icon: 'file_download', label: 'Export as ODT', onClick: onExportOdt } as MenuEntry] : []),
              ...(onExportMd ? [{ icon: 'file_download', label: 'Export as Markdown', onClick: onExportMd } as MenuEntry] : []),
              ...(onExportTxt ? [{ icon: 'file_download', label: 'Export as Plain Text', onClick: onExportTxt } as MenuEntry] : []),
              ...(onPageSetup ? [{ icon: 'settings', label: t('toolbar.pageSetup'), onClick: onPageSetup } as MenuEntry] : []),
              ...(onFileProperties ? [{ icon: 'tune', label: 'Properties', onClick: onFileProperties } as MenuEntry] : []),
            ]}
          />
        )}

        {/* ── Home ── editing & character formatting */}
        <MenuDropdown
          label="Home"
          disabled={disabled}
          items={[
            { icon: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', onClick: onUndo ?? (() => {}), disabled: !canUndo } as MenuEntry,
            { icon: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', onClick: onRedo ?? (() => {}), disabled: !canRedo } as MenuEntry,
            sep,
            { icon: 'content_cut', label: 'Cut', shortcut: 'Ctrl+X', onClick: () => { onRefocusEditor?.(); document.execCommand('cut'); } } as MenuEntry,
            { icon: 'content_copy', label: 'Copy', shortcut: 'Ctrl+C', onClick: () => { onRefocusEditor?.(); document.execCommand('copy'); } } as MenuEntry,
            { icon: 'content_paste', label: 'Paste', shortcut: 'Ctrl+V', onClick: () => { onRefocusEditor?.(); document.execCommand('paste'); } } as MenuEntry,
            {
              icon: 'content_paste_go',
              label: 'Paste without formatting',
              shortcut: 'Ctrl+Shift+V',
              onClick: async () => {
                onRefocusEditor?.();
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) document.execCommand('insertText', false, text);
                } catch { /* browser blocked */ }
              },
            } as MenuEntry,
            sep,
            { icon: 'select_all', label: 'Select all', shortcut: 'Ctrl+A', onClick: () => handleFormat('selectAll') } as MenuEntry,
            ...(onOpenFind ? [{ icon: 'search', label: 'Find…', shortcut: 'Ctrl+F', onClick: onOpenFind } as MenuEntry] : []),
            ...(onOpenFindReplace ? [{ icon: 'find_replace', label: 'Find and replace…', shortcut: 'Ctrl+H', onClick: onOpenFindReplace } as MenuEntry] : []),
            sep,
            { label: `${currentFormatting?.bold ? '\u2713 ' : ''}Bold`, shortcut: 'Ctrl+B', onClick: () => handleFormat('bold') } as MenuEntry,
            { label: `${currentFormatting?.italic ? '\u2713 ' : ''}Italic`, shortcut: 'Ctrl+I', onClick: () => handleFormat('italic') } as MenuEntry,
            { label: `${currentFormatting?.underline ? '\u2713 ' : ''}Underline`, shortcut: 'Ctrl+U', onClick: () => handleFormat('underline') } as MenuEntry,
            { label: `${currentFormatting?.strike ? '\u2713 ' : ''}Strikethrough`, onClick: () => handleFormat('strikethrough') } as MenuEntry,
            { label: `${currentFormatting?.smallCaps ? '\u2713 ' : ''}Small Caps`, onClick: () => handleFormat('toggleSmallCaps') } as MenuEntry,
            { label: `${currentFormatting?.allCaps ? '\u2713 ' : ''}All Caps`, onClick: () => handleFormat('toggleAllCaps') } as MenuEntry,
            sep,
            { icon: 'format_clear', label: 'Clear formatting', shortcut: 'Ctrl+\\', onClick: () => handleFormat('clearFormatting') } as MenuEntry,
            ...(onToggleSpellCheck ? [sep, { icon: 'spellcheck', label: spellCheckEnabled ? '\u2713 Spelling' : 'Spelling', onClick: onToggleSpellCheck } as MenuEntry] : []),
            ...(onToggleVoiceTyping ? [{ icon: 'mic', label: voiceTypingActive ? '\u2713 Voice typing' : 'Voice typing', onClick: onToggleVoiceTyping } as MenuEntry] : []),
          ]}
        />

        {/* ── Insert ── */}
        <MenuDropdown
          label={t('toolbar.insert')}
          disabled={disabled}
          items={[
            ...(onInsertImage ? [{ icon: 'image', label: t('toolbar.image'), onClick: onInsertImage } as MenuEntry] : []),
            ...(showTableInsert && onInsertTable ? [{
              icon: 'grid_on',
              label: t('toolbar.table'),
              submenuContent: (closeMenu: () => void) => (
                <TableGridInline onInsert={(rows, cols) => { handleTableInsert(rows, cols); closeMenu(); }} />
              ),
            } as MenuEntry] : []),
            ...(onInsertImage || (showTableInsert && onInsertTable) ? [sep] : []),
            { icon: 'page_break', label: t('toolbar.pageBreak'), shortcut: 'Ctrl+Enter', onClick: onInsertPageBreak, disabled: !onInsertPageBreak } as MenuEntry,
            { icon: 'horizontal_rule', label: t('toolbar.horizontalLine'), onClick: onInsertHorizontalRule, disabled: !onInsertHorizontalRule } as MenuEntry,
            {
              icon: 'horizontal_rule',
              label: t('toolbar.sectionBreak'),
              disabled: !onInsertSectionBreak,
              submenuContent: (closeMenu: () => void) => (
                <>
                  {([
                    { label: t('toolbar.sectionBreakNextPage'), type: 'nextPage' },
                    { label: t('toolbar.sectionBreakContinuous'), type: 'continuous' },
                    { label: t('toolbar.sectionBreakEvenPage'), type: 'evenPage' },
                    { label: t('toolbar.sectionBreakOddPage'), type: 'oddPage' },
                  ] as const).map((item) => (
                    <SubMenuItem key={item.type} label={item.label} onClick={() => onInsertSectionBreak?.(item.type)} closeMenu={closeMenu} />
                  ))}
                </>
              ),
            } as MenuEntry,
            sep,
            {
              icon: 'tag',
              label: t('toolbar.insertField'),
              disabled: !onInsertField,
              submenuContent: (closeMenu: () => void) => (
                <>
                  {([
                    { label: t('toolbar.fieldPage'), type: 'PAGE' },
                    { label: t('toolbar.fieldNumPages'), type: 'NUMPAGES' },
                    { label: t('toolbar.fieldDate'), type: 'DATE' },
                    { label: t('toolbar.fieldTime'), type: 'TIME' },
                    { label: t('toolbar.fieldCreateDate'), type: 'CREATEDATE' },
                    { label: t('toolbar.fieldSaveDate'), type: 'SAVEDATE' },
                    { label: t('toolbar.fieldAuthor'), type: 'AUTHOR' },
                    { label: t('toolbar.fieldFileName'), type: 'FILENAME' },
                  ] as const).map((item) => (
                    <SubMenuItem key={item.type} label={item.label} onClick={() => onInsertField?.(item.type)} closeMenu={closeMenu} />
                  ))}
                </>
              ),
            } as MenuEntry,
            { icon: 'emoji_symbols', label: t('toolbar.specialCharacters'), onClick: onOpenInsertSymbol, disabled: !onOpenInsertSymbol } as MenuEntry,
            ...(onOpenBuildingBlocks ? [{ label: t('toolbar.buildingBlocks'), onClick: onOpenBuildingBlocks } as MenuEntry] : []),
            ...(onConvertSelectionToTable ? [{ label: t('toolbar.convertToTable'), onClick: onConvertSelectionToTable } as MenuEntry] : []),
            ...(onConvertTableToText ? [{ label: t('toolbar.convertToText'), onClick: onConvertTableToText } as MenuEntry] : []),
            ...(onOpenWatermark ? [sep, { label: t('toolbar.watermark'), onClick: onOpenWatermark } as MenuEntry] : []),
          ]}
        />

        {/* ── Draw ── shapes & text boxes */}
        {(onInsertShape || onInsertTextBox) && (
          <MenuDropdown
            label="Draw"
            disabled={disabled}
            items={[
              ...(onInsertShape ? [{
                icon: 'shapes',
                label: t('toolbar.shape'),
                submenuContent: (closeMenu: () => void) => (
                  <>
                    {([
                      { label: t('toolbar.shapeRectangle'), type: 'rectangle' },
                      { label: t('toolbar.shapeEllipse'), type: 'ellipse' },
                      { label: t('toolbar.shapeLine'), type: 'line' },
                      { label: t('toolbar.shapeArrow'), type: 'arrow' },
                    ] as const).map((item) => (
                      <SubMenuItem key={item.type} label={item.label} onClick={() => onInsertShape(item.type)} closeMenu={closeMenu} />
                    ))}
                  </>
                ),
              } as MenuEntry] : []),
              ...(onInsertTextBox ? [
                { icon: 'edit_note', label: 'Text box', onClick: () => onInsertTextBox('plain') } as MenuEntry,
                { icon: 'chat_bubble_outline', label: 'Callout', onClick: () => onInsertTextBox('callout') } as MenuEntry,
              ] : []),
            ]}
          />
        )}

        {/* ── Design ── theme & watermark */}
        {onSetColorTheme && (
          <MenuDropdown
            label="Design"
            disabled={disabled}
            items={[
              { icon: 'contrast', label: `${colorTheme === 'auto' || !colorTheme ? '\u2713 ' : ''}Match system`, onClick: () => onSetColorTheme('auto') } as MenuEntry,
              { icon: 'light_mode', label: `${colorTheme === 'light' ? '\u2713 ' : ''}Light`, onClick: () => onSetColorTheme('light') } as MenuEntry,
              { icon: 'dark_mode', label: `${colorTheme === 'dark' ? '\u2713 ' : ''}Dark`, onClick: () => onSetColorTheme('dark') } as MenuEntry,
              ...(onOpenWatermark ? [sep, { label: t('toolbar.watermark'), onClick: onOpenWatermark } as MenuEntry] : []),
            ]}
          />
        )}

        {/* ── Layout ── page structure */}
        <MenuDropdown
          label="Layout"
          disabled={disabled}
          items={[
            ...(onPageSetup ? [{ icon: 'settings', label: t('toolbar.pageSetup'), onClick: onPageSetup } as MenuEntry, sep] : []),
            { icon: 'page_break', label: t('toolbar.pageBreak'), shortcut: 'Ctrl+Enter', onClick: onInsertPageBreak, disabled: !onInsertPageBreak } as MenuEntry,
            {
              icon: 'horizontal_rule',
              label: t('toolbar.sectionBreak'),
              disabled: !onInsertSectionBreak,
              submenuContent: (closeMenu: () => void) => (
                <>
                  {([
                    { label: t('toolbar.sectionBreakNextPage'), type: 'nextPage' },
                    { label: t('toolbar.sectionBreakContinuous'), type: 'continuous' },
                    { label: t('toolbar.sectionBreakEvenPage'), type: 'evenPage' },
                    { label: t('toolbar.sectionBreakOddPage'), type: 'oddPage' },
                  ] as const).map((item) => (
                    <SubMenuItem key={item.type} label={item.label} onClick={() => onInsertSectionBreak?.(item.type)} closeMenu={closeMenu} />
                  ))}
                </>
              ),
            } as MenuEntry,
            sep,
            { icon: 'format_line_spacing', label: t('toolbar.customSpacing'), onClick: onOpenParagraphDialog, disabled: !onOpenParagraphDialog } as MenuEntry,
            { icon: 'border_outer', label: t('toolbar.bordersAndShading'), onClick: onOpenBordersShading, disabled: !onOpenBordersShading } as MenuEntry,
            sep,
            { icon: 'format_textdirection_l_to_r', label: t('toolbar.leftToRight'), onClick: () => handleFormat('setLtr') } as MenuEntry,
            { icon: 'format_textdirection_r_to_l', label: t('toolbar.rightToLeft'), onClick: () => handleFormat('setRtl') } as MenuEntry,
          ]}
        />

        {/* ── References ── */}
        {(onInsertTOC || onOpenBookmarks || onInsertFootnote || onOpenCitations) && (
          <MenuDropdown
            label="References"
            disabled={disabled}
            items={[
              ...(onInsertTOC ? [{ icon: 'format_list_numbered', label: t('toolbar.tableOfContents'), onClick: onInsertTOC } as MenuEntry] : []),
              ...(onInsertFootnote ? [{ icon: 'note_add', label: t('toolbar.footnote'), onClick: onInsertFootnote } as MenuEntry] : []),
              ...(onOpenBookmarks ? [{ icon: 'bookmark', label: t('toolbar.bookmarks'), onClick: onOpenBookmarks } as MenuEntry] : []),
              ...(onOpenCitations ? [{ icon: 'format_quote', label: t('toolbar.citations'), onClick: onOpenCitations } as MenuEntry] : []),
            ]}
          />
        )}

        {/* ── Review ── */}
        {(onToggleSpellcheck || onToggleSpellCheck || onOpenDictionary || onOpenWordCount ||
          onOpenTranslate || onTranslateDocument || onOpenWritingAssistant || onOpenExplore) && (
          <MenuDropdown
            label="Review"
            disabled={disabled}
            items={[
              ...(onOpenWordCount ? [{ icon: 'format_list_numbered', label: t('toolbar.wordCount'), shortcut: 'Ctrl+Shift+C', onClick: onOpenWordCount } as MenuEntry, sep] : []),
              ...(onToggleSpellcheck ? [{ icon: 'spellcheck', label: spellcheckEnabled ? '\u2713 Spell check' : 'Spell check', onClick: onToggleSpellcheck } as MenuEntry] : []),
              ...(onOpenDictionary ? [{ label: t('toolbar.dictionary'), shortcut: 'Ctrl+Shift+Y', onClick: onOpenDictionary } as MenuEntry] : []),
              ...(onOpenTranslate ? [{ icon: 'translate', label: t('toolbar.translate'), onClick: onOpenTranslate } as MenuEntry] : []),
              ...(onTranslateDocument ? [{ icon: 'description', label: 'Translate document…', onClick: onTranslateDocument } as MenuEntry] : []),
              ...(onOpenWritingAssistant ? [sep, { icon: 'auto_awesome', label: 'Writing assistant…', onClick: onOpenWritingAssistant } as MenuEntry] : []),
              ...(onOpenExplore ? [{ icon: 'explore', label: t('toolbar.explore'), onClick: onOpenExplore } as MenuEntry] : []),
            ]}
          />
        )}

        {/* ── View ── */}
        {(onZoomChange || onToggleShowRuler || onToggleShowFormattingMarks || onToggleOutline) && (
          <MenuDropdown
            label="View"
            disabled={disabled}
            items={[
              ...(onZoomChange ? [
                { icon: 'add', label: 'Zoom in', shortcut: 'Ctrl+=', onClick: () => onZoomChange(Math.min((zoom ?? 1) * 1.1, 4)) } as MenuEntry,
                { icon: 'remove', label: 'Zoom out', shortcut: 'Ctrl+-', onClick: () => onZoomChange(Math.max((zoom ?? 1) / 1.1, 0.25)) } as MenuEntry,
                { icon: 'restart_alt', label: 'Reset zoom (100%)', shortcut: 'Ctrl+0', onClick: () => onZoomChange(1) } as MenuEntry,
              ] : []),
              ...(onZoomChange && (onToggleShowRuler || onToggleShowFormattingMarks || onToggleOutline) ? [sep] : []),
              ...(onToggleShowRuler ? [{ icon: 'straighten', label: `${rulerVisible ? '\u2713 ' : ''}Show ruler`, onClick: onToggleShowRuler } as MenuEntry] : []),
              ...(onToggleShowFormattingMarks ? [{ label: `${showFormattingMarks ? '\u2713 ' : ''}${t('toolbar.showFormattingMarks')}`, onClick: onToggleShowFormattingMarks } as MenuEntry] : []),
              ...(onToggleOutline ? [{ label: `${outlineVisible ? '\u2713 ' : ''}${t('toolbar.showOutline')}`, shortcut: 'Ctrl+Shift+H', onClick: onToggleOutline } as MenuEntry] : []),
            ]}
          />
        )}

        {/* ── Help ── */}
        <MenuDropdown
          label={t('toolbar.help')}
          disabled={disabled}
          items={[
            ...(onOpenCommandPalette ? [{ label: t('toolbar.searchMenus'), onClick: onOpenCommandPalette } as MenuEntry, sep] : []),
            ...(onOpenKeyboardShortcuts ? [{ label: t('toolbar.keyboardShortcuts'), onClick: onOpenKeyboardShortcuts } as MenuEntry] : []),
            ...(onOpenPreferences ? [{ icon: 'tune', label: t('toolbar.preferences'), onClick: onOpenPreferences } as MenuEntry] : []),
            ...(onOpenAccessibility ? [{ icon: 'accessibility', label: t('toolbar.accessibility'), onClick: onOpenAccessibility } as MenuEntry] : []),
            sep,
            { icon: 'bug_report', label: t('toolbar.reportIssue'), onClick: () => (onReportBug ? onReportBug() : openReportIssue()) } as MenuEntry,
            ...(onShowAbout ? [sep, { icon: 'info', label: 'About', onClick: onShowAbout } as MenuEntry] : []),
          ]}
        />
      </div>
    </MenuBarProvider>
  );
}


// ============================================================================
// TitleBar
// ============================================================================

export interface TitleBarProps {
  children: ReactNode;
}

/**
 * TitleBar layout (Google Docs style):
 *
 *   ┌──────────┬────────────────────────────┬──────────────────┐
 *   │          │ Document Name              │                  │
 *   │  Logo    │                            │  Right Actions   │
 *   │          │ File  Format  Insert       │                  │
 *   └──────────┴────────────────────────────┴──────────────────┘
 *
 * Logo and TitleBarRight span full height. DocumentName + MenuBar
 * stack vertically in the center column.
 */
export function TitleBar({ children }: TitleBarProps) {
  let logoItem: ReactNode = null;
  let rightItem: ReactNode = null;
  const middleTopItems: ReactNode[] = [];
  const menuBarItems: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Logo) {
      logoItem = child;
    } else if (child.type === TitleBarRight) {
      rightItem = child;
    } else if (child.type === MenuBar) {
      menuBarItems.push(child);
    } else {
      middleTopItems.push(child);
    }
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'OPTION';

    if (!isInteractive) {
      e.preventDefault();
    }
  }, []);

  return (
    <div
      className="flex items-stretch bg-[color:var(--doc-chrome,#eef1f5)] text-[color:var(--doc-text-on-surface,#1f2937)] pt-2 pb-1"
      onMouseDown={handleMouseDown}
      data-testid="title-bar"
    >
      {/* Left: Logo — only rendered when host provides renderLogo */}
      {logoItem && (
        <div className="flex items-center flex-shrink-0 pl-3 pr-1">
          {logoItem}
        </div>
      )}

      {/* Center: doc name on top, menus below */}
      <div className="flex flex-col justify-center flex-1 min-w-0 py-1 overflow-hidden">
        {middleTopItems.length > 0 && (
          <div className="flex items-center gap-2 px-1 min-w-0">{middleTopItems}</div>
        )}
        {menuBarItems.length > 0 && (
          <div
            className="flex items-center px-1 min-w-0 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {menuBarItems}
          </div>
        )}
      </div>

      {/* Right: actions spanning full height */}
      {rightItem && <div className="flex items-center flex-shrink-0 px-3">{rightItem}</div>}
    </div>
  );
}
