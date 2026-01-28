import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegisterType from '../components/RegisterType';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// Mock images
jest.mock('../assets/illustrations/registration-illustration2.png', () => 'registration-illustration.png');
jest.mock('../assets/icons/donor-icon.png', () => 'donor-icon.png');
jest.mock('../assets/icons/receiver-icon.png', () => 'receiver-icon.png');
jest.mock('../assets/Logo.png', () => 'logo.png');
jest.mock('../style/RegisterType.css', () => ({}), { virtual: true });

describe('RegisterType', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the main heading', () => {
        render(<RegisterType />);
        expect(screen.getByText('Join FoodFlow')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
        render(<RegisterType />);
        expect(screen.getByText('Choose your role to start making an impact.')).toBeInTheDocument();
    });

    it('renders the logo', () => {
        render(<RegisterType />);
        const logo = screen.getByAltText('FoodFlow Logo');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', 'logo.png');
    });

    it('navigates to home page when logo is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<RegisterType />);
        
        const logoContainer = screen.getByAltText('FoodFlow Logo').closest('.logo-container');
        await user.click(logoContainer);
        
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('renders donor card with correct content', () => {
        render(<RegisterType />);
        
        expect(screen.getByText("I'm Donating")).toBeInTheDocument();
        expect(screen.getByText(/For restaurants, grocery stores, and event organizers/i)).toBeInTheDocument();
    });

    it('renders donor icon', () => {
        render(<RegisterType />);
        const donorIcon = screen.getByAltText('Donor Icon');
        expect(donorIcon).toBeInTheDocument();
        expect(donorIcon).toHaveAttribute('src', 'donor-icon.png');
        expect(donorIcon).toHaveAttribute('height', '129');
        expect(donorIcon).toHaveAttribute('width', '129');
    });

    it('renders donor benefits list', () => {
        render(<RegisterType />);
        
        expect(screen.getByText("Post what's available")).toBeInTheDocument();
        expect(screen.getByText('Connect with nearby charities')).toBeInTheDocument();
        expect(screen.getByText('Watch your impact grow')).toBeInTheDocument();
    });

    it('renders donor register button', () => {
        render(<RegisterType />);
        const donorButton = screen.getByRole('button', { name: /register as a donor/i });
        expect(donorButton).toBeInTheDocument();
        expect(donorButton).toHaveClass('register-button', 'donor-button');
    });

    it('navigates to donor registration when donor button is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<RegisterType />);
        
        const donorButton = screen.getByRole('button', { name: /register as a donor/i });
        await user.click(donorButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/register/donor');
    });

    it('renders the center illustration', () => {
        render(<RegisterType />);
        const illustration = screen.getByAltText('Woman carrying food box');
        expect(illustration).toBeInTheDocument();
        expect(illustration).toHaveAttribute('src', 'registration-illustration.png');
        expect(illustration).toHaveAttribute('height', '892');
        expect(illustration).toHaveAttribute('width', '595');
    });

    it('renders receiver card with correct content', () => {
        render(<RegisterType />);
        
        expect(screen.getByText("I'm Receiving")).toBeInTheDocument();
        expect(screen.getByText(/For charities, shelters, and community kitchens/i)).toBeInTheDocument();
    });

    it('renders receiver icon', () => {
        render(<RegisterType />);
        const receiverIcon = screen.getByAltText('Receiver Icon');
        expect(receiverIcon).toBeInTheDocument();
        expect(receiverIcon).toHaveAttribute('src', 'receiver-icon.png');
        expect(receiverIcon).toHaveAttribute('height', '129');
        expect(receiverIcon).toHaveAttribute('width', '129');
    });

    it('renders receiver benefits list', () => {
        render(<RegisterType />);
        
        expect(screen.getByText('Accept fresh donations nearby')).toBeInTheDocument();
        expect(screen.getByText('Connect directly with food donors')).toBeInTheDocument();
        expect(screen.getByText('Feed your community efficiently')).toBeInTheDocument();
    });

    it('renders receiver register button', () => {
        render(<RegisterType />);
        const receiverButton = screen.getByRole('button', { name: /register as a receiver/i });
        expect(receiverButton).toBeInTheDocument();
        expect(receiverButton).toHaveClass('register-button', 'receiver-button');
    });

    it('navigates to receiver registration when receiver button is clicked', async () => {
        const user = userEvent.setup({ delay: null });
        render(<RegisterType />);
        
        const receiverButton = screen.getByRole('button', { name: /register as a receiver/i });
        await user.click(receiverButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/register/receiver');
    });

    it('renders both option cards', () => {
        render(<RegisterType />);
        
        const optionCards = screen.getAllByRole('heading', { level: 3 });
        expect(optionCards).toHaveLength(2);
        expect(optionCards[0]).toHaveTextContent("I'm Donating");
        expect(optionCards[1]).toHaveTextContent("I'm Receiving");
    });

    it('renders all images with correct alt text', () => {
        render(<RegisterType />);
        
        expect(screen.getByAltText('FoodFlow Logo')).toBeInTheDocument();
        expect(screen.getByAltText('Donor Icon')).toBeInTheDocument();
        expect(screen.getByAltText('Receiver Icon')).toBeInTheDocument();
        expect(screen.getByAltText('Woman carrying food box')).toBeInTheDocument();
    });

    it('logo container has cursor pointer style', () => {
        render(<RegisterType />);
        
        const logoContainer = screen.getByAltText('FoodFlow Logo').closest('.logo-container');
        expect(logoContainer).toHaveStyle({ cursor: 'pointer' });
    });

    it('renders all unordered lists', () => {
        render(<RegisterType />);
        
        const lists = screen.getAllByRole('list');
        expect(lists).toHaveLength(2); // One for donor, one for receiver
    });

    it('renders correct number of list items', () => {
        render(<RegisterType />);
        
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(6); // 3 for donor + 3 for receiver
    });

    it('has correct class names for main container', () => {
        render(<RegisterType />);
        
        const mainContainer = screen.getByText('Join FoodFlow').closest('.register-type-page');
        expect(mainContainer).toHaveClass('register-type-page');
    });

    it('has correct class names for donor card', () => {
        render(<RegisterType />);
        
        const donorCard = screen.getByText("I'm Donating").closest('.option-card');
        expect(donorCard).toHaveClass('option-card', 'donor');
    });

    it('has correct class names for receiver card', () => {
        render(<RegisterType />);
        
        const receiverCard = screen.getByText("I'm Receiving").closest('.option-card');
        expect(receiverCard).toHaveClass('option-card', 'receiver');
    });

    it('renders intro section with correct class', () => {
        render(<RegisterType />);
        
        const intro = screen.getByText('Join FoodFlow').closest('.intro');
        expect(intro).toBeInTheDocument();
        expect(intro).toHaveClass('intro');
    });

    it('subtitle has correct class', () => {
        render(<RegisterType />);
        
        const subtitle = screen.getByText('Choose your role to start making an impact.');
        expect(subtitle).toHaveClass('subtitle');
    });

    it('renders content section with correct class', () => {
        render(<RegisterType />);
        
        const content = screen.getByText("I'm Donating").closest('.content');
        expect(content).toHaveClass('content');
    });

    it('illustration container has correct class', () => {
        render(<RegisterType />);
        
        const illustrationContainer = screen.getByAltText('Woman carrying food box').closest('.illustration');
        expect(illustrationContainer).toHaveClass('illustration');
    });
});