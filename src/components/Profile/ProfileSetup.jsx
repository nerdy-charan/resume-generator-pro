import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import { resumeParserService } from '../../services/resumeParserService';

function ProfileSetup({ onComplete }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadMode, setUploadMode] = useState(true); // true = upload, false = manual
    const [parsing, setParsing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        linkedin: '',
        location: '',
        experience: [
            {
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                current: false,
                achievements: ['']
            }
        ],
        skills: {
            technical: [],
            soft: []
        },
        education: [
            {
                school: '',
                degree: '',
                field: '',
                graduationYear: ''
            }
        ],
        certifications: []
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or DOCX file');
            return;
        }

        setParsing(true);

        try {
            // Parse file (backend handles extraction + AI parsing)
            const parsedData = await resumeParserService.parseResumeFile(file);

            // Update form with parsed data
            setFormData(parsedData);
            setUploadMode(false); // Switch to manual mode to show the data

            alert('Resume parsed successfully! Review and edit the information below, then save. ✅');
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to parse resume. Please try again or fill manually.');
        } finally {
            setParsing(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experience: [
                ...prev.experience,
                {
                    company: '',
                    position: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    achievements: ['']
                }
            ]
        }));
    };

    const updateExperience = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.map((exp, i) =>
                i === index ? { ...exp, [field]: value } : exp
            )
        }));
    };

    const addAchievement = (expIndex) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.map((exp, i) =>
                i === expIndex
                    ? { ...exp, achievements: [...exp.achievements, ''] }
                    : exp
            )
        }));
    };

    const updateAchievement = (expIndex, achIndex, value) => {
        setFormData(prev => ({
            ...prev,
            experience: prev.experience.map((exp, i) =>
                i === expIndex
                    ? {
                        ...exp,
                        achievements: exp.achievements.map((ach, j) =>
                            j === achIndex ? value : ach
                        )
                    }
                    : exp
            )
        }));
    };

    const handleSkillsChange = (type, value) => {
        const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
        setFormData(prev => ({
            ...prev,
            skills: { ...prev.skills, [type]: skillsArray }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await profileService.saveProfile(user.uid, formData);
            alert('Profile saved successfully! ✅');
            if (onComplete) onComplete();
        } catch (error) {
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Create Your Master Profile
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Upload your existing resume or fill manually
                    </p>

                    {/* Upload or Manual Toggle */}
                    {uploadMode ? (
                        <div className="mb-8">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                {parsing ? (
                                    <div>
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Parsing your resume with AI...</p>
                                        <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-5xl mb-4">📄</div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                            Upload Your Existing Resume
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            AI will automatically extract all your information
                                        </p>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="resume-upload"
                                        />
                                        <label
                                            htmlFor="resume-upload"
                                            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                                        >
                                            Choose File (PDF or DOCX)
                                        </label>
                                        <p className="text-sm text-gray-500 mt-4">
                                            Supported formats: PDF, DOC, DOCX
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode(false)}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Or fill manually instead →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode(true)}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    ← Upload resume instead
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Personal Info */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.fullName}
                                                onChange={(e) => handleChange('fullName', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                LinkedIn
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.linkedin}
                                                onChange={(e) => handleChange('linkedin', e.target.value)}
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => handleChange('location', e.target.value)}
                                                placeholder="City, State"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Work Experience */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            Work Experience
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addExperience}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                        >
                                            + Add Experience
                                        </button>
                                    </div>

                                    {formData.experience.map((exp, expIndex) => (
                                        <div key={expIndex} className="border border-gray-200 rounded-lg p-6 mb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Company *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={exp.company}
                                                        onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Position *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={exp.position}
                                                        onChange={(e) => updateExperience(expIndex, 'position', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Start Date *
                                                    </label>
                                                    <input
                                                        type="month"
                                                        required
                                                        value={exp.startDate}
                                                        onChange={(e) => updateExperience(expIndex, 'startDate', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        End Date
                                                    </label>
                                                    <input
                                                        type="month"
                                                        value={exp.endDate}
                                                        onChange={(e) => updateExperience(expIndex, 'endDate', e.target.value)}
                                                        disabled={exp.current}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                                    />
                                                    <label className="flex items-center mt-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={exp.current}
                                                            onChange={(e) => updateExperience(expIndex, 'current', e.target.checked)}
                                                            className="mr-2"
                                                        />
                                                        <span className="text-sm text-gray-600">Currently working here</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Key Achievements *
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => addAchievement(expIndex)}
                                                        className="text-blue-500 text-sm hover:text-blue-600"
                                                    >
                                                        + Add Achievement
                                                    </button>
                                                </div>
                                                {exp.achievements.map((achievement, achIndex) => (
                                                    <textarea
                                                        key={achIndex}
                                                        required
                                                        value={achievement}
                                                        onChange={(e) => updateAchievement(expIndex, achIndex, e.target.value)}
                                                        placeholder="• Led a team of 5 engineers to deliver..."
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                                                        rows="2"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Skills */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                        Skills
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Technical Skills (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={formData.skills.technical.join(', ')}
                                                onChange={(e) => handleSkillsChange('technical', e.target.value)}
                                                placeholder="React, Node.js, Python, AWS, SQL"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Soft Skills (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={formData.skills.soft.join(', ')}
                                                onChange={(e) => handleSkillsChange('soft', e.target.value)}
                                                placeholder="Leadership, Communication, Problem Solving"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                        Education
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                School/University *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.education[0].school}
                                                onChange={(e) =>
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        education: [{ ...prev.education[0], school: e.target.value }]
                                                    }))
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Degree *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.education[0].degree}
                                                onChange={(e) =>
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        education: [{ ...prev.education[0], degree: e.target.value }]
                                                    }))
                                                }
                                                placeholder="Bachelor's, Master's, etc."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Field of Study *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.education[0].field}
                                                onChange={(e) =>
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        education: [{ ...prev.education[0], field: e.target.value }]
                                                    }))
                                                }
                                                placeholder="Computer Science, Business, etc."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Graduation Year *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.education[0].graduationYear}
                                                onChange={(e) =>
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        education: [{ ...prev.education[0], graduationYear: e.target.value }]
                                                    }))
                                                }
                                                placeholder="2024"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-4 pt-6 border-t">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfileSetup;