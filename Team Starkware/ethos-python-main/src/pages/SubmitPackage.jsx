import React, { useState } from 'react';
import './SubmitPackage.css';

const SubmitPackage = () => {
    const [formData, setFormData] = useState({
        senderName: '',
        pickupLocation: '',
        packageDescription: '',
        packageWeight: '',
        deliveryTime: '',
        receiverName: '',
        destination: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/ethos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log('Backend Response:', data);

            if (response.ok) {
                alert('Package submitted successfully! Check console for response.');
                setFormData({
                    senderName: '',
                    pickupLocation: '',
                    packageDescription: '',
                    packageWeight: '',
                    deliveryTime: '',
                    receiverName: '',
                    destination: ''
                });
            } else {
                alert('Failed to submit package. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting package:', error);
            alert('Error submitting package. Please check if the backend is running.');
        }
    };

    return (
        <div className="submit-container">
            <h1 className="page-title">Package Details</h1>

            <div className="submit-card">
                <form onSubmit={handleSubmit}>

                    <div className="section">
                        <h2 className="section-title">Sender Details</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Sender Name</label>
                                <input
                                    type="text"
                                    name="senderName"
                                    value={formData.senderName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pickup Location</label>
                                <input
                                    type="text"
                                    name="pickupLocation"
                                    value={formData.pickupLocation}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter address"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h2 className="section-title">Package Description</h2>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input
                                type="text"
                                name="packageDescription"
                                value={formData.packageDescription}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Fragile items, Electronics"
                                required
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Weight of Package</label>
                                <input
                                    type="text"
                                    name="packageWeight"
                                    value={formData.packageWeight}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g. 2kg"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time for Delivery</label>
                                <input
                                    type="text"
                                    name="deliveryTime"
                                    value={formData.deliveryTime}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g. 2:00 PM"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h2 className="section-title">Receiver Details</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Receiver Name</label>
                                <input
                                    type="text"
                                    name="receiverName"
                                    value={formData.receiverName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Destination</label>
                                <input
                                    type="text"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter destination"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn">Submit Package</button>

                </form>
            </div>
        </div>
    );
};

export default SubmitPackage;
