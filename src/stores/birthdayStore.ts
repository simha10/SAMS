import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BirthdayState {
    birthdayMessage: string | null;
    showBirthdayBanner: boolean;
    setBirthdayMessage: (message: string | null) => void;
    setShowBirthdayBanner: (show: boolean) => void;
    hideBirthdayBanner: () => void;
}

export const useBirthdayStore = create<BirthdayState>()(
    persist(
        (set) => ({
            birthdayMessage: null,
            showBirthdayBanner: false,
            setBirthdayMessage: (message: string | null) => {
                set({ birthdayMessage: message });
            },
            setShowBirthdayBanner: (show: boolean) => {
                set({ showBirthdayBanner: show });
            },
            hideBirthdayBanner: () => {
                set({ showBirthdayBanner: false, birthdayMessage: null });
            },
        }),
        {
            name: 'birthday-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);