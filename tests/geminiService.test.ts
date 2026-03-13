import { describe, it, expect } from 'vitest';
import { parseJsonSafe } from '../services/geminiService';

describe('parseJsonSafe', () => {
  // 1. Чист JSON
  it('враќа парсиран объект за валиден JSON', () => {
    const input = '{"title":"Множество","objectives":["цел1"]}';
    expect(parseJsonSafe(input)).toEqual({ title: 'Множество', objectives: ['цел1'] });
  });

  // 2. Празен string
  it('враќа null за празен string', () => {
    expect(parseJsonSafe('')).toBeNull();
  });

  // 3. Markdown code block ```json ... ```
  it('отстранува ```json блок пред парсирање', () => {
    const input = '```json\n{"title":"Тест"}\n```';
    expect(parseJsonSafe(input)).toEqual({ title: 'Тест' });
  });

  // 4. Само ``` без json
  it('отстранува обичен ``` блок', () => {
    const input = '```\n{"title":"Тест"}\n```';
    expect(parseJsonSafe(input)).toEqual({ title: 'Тест' });
  });

  // 5. AI artifact: "svg <svg..." → "<svg..."
  it('го чисти svg артефактот пред <svg тагот', () => {
    const input = '{"content":"svg <svg viewBox=\\"0 0 100 100\\"></svg>"}';
    const result = parseJsonSafe(input);
    expect(result?.content).toContain('<svg');
    expect(result?.content).not.toMatch(/^svg\s+<svg/);
  });

  // 6. Backslash fallback — AI го крши JSON со backslashes
  it('ги поправа backslash грешките преку fallback', () => {
    // JSON со backslash наместо / — ова го прави AI понекогаш
    const broken = '{"path":"C:\\\\Users\\\\test"}';
    // Треба да не фрли грешка
    const result = parseJsonSafe(broken);
    expect(result).not.toBeNull();
  });

  // 7. Вгнездени полиња
  it('правилно парсира вгнездени структури', () => {
    const input = JSON.stringify({
      title: 'Квиз',
      questions: [{ text: 'Колку е 2+2?', options: ['3', '4', '5'], correct: 1 }]
    });
    const result = parseJsonSafe(input);
    expect(result?.questions).toHaveLength(1);
    expect(result?.questions[0].correct).toBe(1);
  });

  // 8. Whitespace и newlines околу JSON
  it('го trim-ува whitespace околу JSON', () => {
    const input = '   \n  {"title":"Агол"}  \n  ';
    expect(parseJsonSafe(input)).toEqual({ title: 'Агол' });
  });

  // 9. Целосно невалиден JSON фрла грешка
  it('фрла грешка за целосно невалиден JSON', () => {
    expect(() => parseJsonSafe('ова не е json воопшто!!!')).toThrow();
  });

  // 10. Низа на врвно ниво (array)
  it('го парсира JSON array на врвно ниво', () => {
    const input = '[{"question":"Колку е 3²?"},{"question":"Колку е √16?"}]';
    const result = parseJsonSafe(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  // 11. Unicode математички симболи — не треба да крши JSON
  it('правилно парсира Unicode математика (π, ², √)', () => {
    const input = JSON.stringify({ formula: 'P = 2·r·π', area: 'A = r²' });
    const result = parseJsonSafe(input);
    expect(result?.formula).toBe('P = 2·r·π');
    expect(result?.area).toBe('A = r²');
  });

  // 12. Македонски текст во вредности
  it('правилно парсира кирилица во JSON вредности', () => {
    const input = JSON.stringify({
      title: 'Агли и триаголници',
      content: 'Сумата на агли во триаголник е 180°'
    });
    const result = parseJsonSafe(input);
    expect(result?.content).toContain('180°');
  });
});
