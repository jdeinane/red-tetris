import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
	const navigate = useNavigate();

	return (
		<div className="page-container">
		<div className="content-box" style={{ textAlign: 'center' }}>
			<h1 className="title" style={{ color: '#ff6b6b' }}>404</h1>
			<h2 style={{ marginBottom: '20px' }}>Page Not Found</h2>
			<p style={{ marginBottom: '30px', opacity: 0.8 }}>
			This page does not exist.
			</p>
			<button 
			className="form-button" 
			onClick={() => navigate('/')}
			>
			Back to Home
			</button>
		</div>
		</div>
	);
}
