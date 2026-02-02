/*
import { render, screen, fireEvent } from '@testing-library/react';
import PackCalculator from './components/PackCalculator';

describe('PackCalculator', () => {
  it('renders calculator title', () => {
    render(<PackCalculator />);
    expect(screen.getByText('Calculadora de Packs WhatsApp')).toBeInTheDocument();
  });

  it('calculates recommended pack correctly', () => {
    render(<PackCalculator />);
    
    const input = screen.getByLabelText(/cuántos turnos/i);
    fireEvent.change(input, { target: { value: '150' } });
    
    expect(screen.getByText(/Pack 200/i)).toBeInTheDocument();
  });

  it('shows savings when applicable', () => {
    render(<PackCalculator />);
    
    const input = screen.getByLabelText(/cuántos turnos/i);
    fireEvent.change(input, { target: { value: '200' } });
    
    expect(screen.getByText(/Tu Ahorro/i)).toBeInTheDocument();
  });

  it('displays all packs', () => {
    render(<PackCalculator />);
    
    expect(screen.getByText(/Pack 50/i)).toBeInTheDocument();
    expect(screen.getByText(/Pack 5000/i)).toBeInTheDocument();
  });
});
*/