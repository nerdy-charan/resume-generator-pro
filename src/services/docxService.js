import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const docxService = {
    async generateResume(resumeData, userProfile) {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Header with name and contact
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: userProfile.fullName,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: { after: 100 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${userProfile.email} | ${userProfile.phone || ''} | ${userProfile.location || ''}`,
                                size: 20,
                            }),
                        ],
                        spacing: { after: 300 },
                    }),

                    // Professional Summary
                    new Paragraph({
                        text: 'PROFESSIONAL SUMMARY',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 100 },
                    }),
                    new Paragraph({
                        text: resumeData.summary,
                        spacing: { after: 300 },
                    }),

                    // Experience
                    new Paragraph({
                        text: 'EXPERIENCE',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 100 },
                    }),
                    ...this.generateExperienceSection(resumeData.experience),

                    // Skills
                    new Paragraph({
                        text: 'SKILLS',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 100 },
                    }),
                    new Paragraph({
                        text: resumeData.skills.join(', '),
                        spacing: { after: 300 },
                    }),

                    // Education
                    new Paragraph({
                        text: 'EDUCATION',
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 100 },
                    }),
                    ...this.generateEducationSection(resumeData.education),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Resume_${userProfile.fullName.replace(/\s+/g, '_')}.docx`);
    },

    generateExperienceSection(experiences) {
        const paragraphs = [];

        experiences.forEach((exp, index) => {
            // Company and position
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: exp.position,
                            bold: true,
                            size: 24,
                        }),
                    ],
                    spacing: { before: index > 0 ? 200 : 0, after: 50 },
                })
            );

            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${exp.company} | ${exp.period}`,
                            italics: true,
                            size: 22,
                        }),
                    ],
                    spacing: { after: 100 },
                })
            );

            // Achievements
            exp.achievements.forEach((achievement) => {
                paragraphs.push(
                    new Paragraph({
                        text: achievement,
                        bullet: { level: 0 },
                        spacing: { after: 50 },
                    })
                );
            });
        });

        return paragraphs;
    },

    generateEducationSection(education) {
        return education.map((edu) =>
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${edu.degree} in ${edu.field}`,
                        bold: true,
                    }),
                    new TextRun({
                        text: ` - ${edu.school} (${edu.year})`,
                    }),
                ],
                spacing: { after: 100 },
            })
        );
    },
};

export default docxService;