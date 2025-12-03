const resumeParserService = {
    async parseResumeFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to parse resume');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Resume parsing error:', error);
            throw error;
        }
    }
};

export default resumeParserService;