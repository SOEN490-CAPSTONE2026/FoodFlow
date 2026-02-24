import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DistanceControl from '../DonationsMap/DistanceControl';

describe('DistanceControl', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders distance label', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      expect(screen.getByText(/distance radius/i)).toBeInTheDocument();
    });

    it('renders current distance value', () => {
      render(<DistanceControl distance={15} onChange={mockOnChange} />);
      expect(screen.getByText('15km')).toBeInTheDocument();
    });

    it('renders slider input', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('renders preset buttons', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      expect(screen.getByRole('button', { name: '2km' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5km' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10km' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '25km' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '50km' })).toBeInTheDocument();
    });
  });

  describe('Slider Interaction', () => {
    it('has correct initial value', () => {
      render(<DistanceControl distance={25} onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('25');
    });

    it('calls onChange when slider value changes', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '30' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(30);
    });

    it('handles multiple slider changes', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');

      fireEvent.change(slider, { target: { value: '20' } });
      fireEvent.change(slider, { target: { value: '35' } });
      fireEvent.change(slider, { target: { value: '50' } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 20);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 35);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 50);
    });
  });

  describe('Slider Attributes', () => {
    it('has minimum value of 1', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '1');
    });

    it('has maximum value of 50', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '50');
    });

    it('accepts custom min and max values', () => {
      render(
        <DistanceControl
          distance={15}
          onChange={mockOnChange}
          min={5}
          max={100}
        />
      );
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '5');
      expect(slider).toHaveAttribute('max', '100');
    });
  });

  describe('Preset Buttons', () => {
    it('calls onChange when preset button is clicked', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const preset25 = screen.getByRole('button', { name: '25km' });
      fireEvent.click(preset25);
      expect(mockOnChange).toHaveBeenCalledWith(25);
    });

    it('highlights active preset button', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const preset10 = screen.getByRole('button', { name: '10km' });
      expect(preset10).toHaveClass('active');
    });

    it('does not highlight inactive preset buttons', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);
      const preset25 = screen.getByRole('button', { name: '25km' });
      expect(preset25).not.toHaveClass('active');
    });

    it('handles clicking multiple preset buttons', () => {
      render(<DistanceControl distance={10} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: '2km' }));
      fireEvent.click(screen.getByRole('button', { name: '50km' }));

      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 2);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 50);
    });
  });

  describe('Distance Display', () => {
    it('displays distance in header', () => {
      render(<DistanceControl distance={7} onChange={mockOnChange} />);
      expect(screen.getByText('7km')).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    it('uses default distance of 10', () => {
      render(<DistanceControl onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('10');
    });

    it('renders with default min and max', () => {
      render(<DistanceControl onChange={mockOnChange} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '50');
    });
  });

  describe('Styling', () => {
    it('has proper CSS classes', () => {
      const { container } = render(
        <DistanceControl distance={10} onChange={mockOnChange} />
      );
      expect(container.querySelector('.distance-control')).toBeInTheDocument();
      expect(container.querySelector('.distance-slider')).toBeInTheDocument();
      expect(container.querySelector('.distance-presets')).toBeInTheDocument();
    });
  });
});
