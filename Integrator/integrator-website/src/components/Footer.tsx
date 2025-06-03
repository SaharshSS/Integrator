import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer>
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} Tamil Dictionary. All rights reserved.</p>
                <p>Contact us: support@tamildictionary.com</p>
            </div>
        </footer>
    );
};

export default Footer;