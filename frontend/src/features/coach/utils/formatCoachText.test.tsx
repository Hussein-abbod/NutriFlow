import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatCoachText } from './formatCoachText';

const html = (text: string) => render(<p>{formatCoachText(text)}</p>).container.innerHTML;

describe('formatCoachText', () => {
  it('keeps plain text as it is', () => {
    expect(html('Eat more greens.\nDrink water.')).toBe('<p>Eat more greens.\nDrink water.</p>');
  });

  it('turns **bold** into <strong>', () => {
    expect(html('Try **grilled fish** and **rice**.')).toBe(
      '<p>Try <strong>grilled fish</strong> and <strong>rice</strong>.</p>',
    );
  });

  it('leaves unmatched or empty markers alone', () => {
    expect(html('2 ** 3 and **open')).toBe('<p>2 ** 3 and **open</p>');
  });

  it('never renders HTML from the text', () => {
    const container = render(
      <p>{formatCoachText('<img src=x onerror="alert(1)"> **<b>hi</b>**')}</p>,
    ).container;
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('<img src=x onerror="alert(1)"> <b>hi</b>');
  });
});
