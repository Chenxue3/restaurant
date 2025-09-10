import React from 'react';
import { render } from '@/test/test-utils';

describe('test-utils', () => {
  it('renders with ThemeProvider wrapper', () => {
    const TestComponent = () => <div>Test</div>;
    const { container } = render(<TestComponent />);
    expect(container).toBeInTheDocument();
  });
}); 