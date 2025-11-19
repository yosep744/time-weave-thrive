export const getLocalDate = (): string => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};

export const getLocalWeekStart = (): string => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sunday) - 6 (Saturday)
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(now.setDate(diff));

    const offset = monday.getTimezoneOffset() * 60000;
    const localMonday = new Date(monday.getTime() - offset);
    return localMonday.toISOString().split('T')[0];
};
