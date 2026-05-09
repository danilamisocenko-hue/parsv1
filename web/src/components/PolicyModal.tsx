import React from "react";
import { X, ShieldCheck, ScrollText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type PolicyType = 'terms' | 'privacy';

export const PolicyModal = ({ isOpen, onClose, type }: { isOpen: boolean, onClose: () => void, type: PolicyType }) => {
  const content = {
    terms: {
      title: "Условия использования",
      icon: <ScrollText className="w-8 h-8 text-indigo-400" />,
      text: `
        1. ОБЩИЕ ПОЛОЖЕНИЯ
        1.1. Настоящие Условия регулируют использование сервиса FRESKO.CT (далее — "Сервис").
        1.2. Используя Сервис, вы соглашаетесь с данными условиями в полном объеме.

        2. ПРЕДОСТАВЛЕНИЕ УСЛУГ
        2.1. Сервис предоставляет инструменты для автоматизации сбора открытых данных.
        2.2. Запрещается использование Сервиса для нарушения законов РФ и других стран, а также для несанкционированного доступа к закрытым данным.

        3. ОПЛАТА И ТАРИФЫ
        3.1. Доступ к функциям Сервиса осуществляется на платной основе согласно выбранному тарифному плану.
        3.2. Возврат средств возможен только в случае технических сбоев, подтвержденных поддержкой.

        4. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ
        4.1. Сервис не несет ответственности за любые прямые или косвенные убытки, возникшие в результате использования ПО.
        4.2. Пользователь несет полную ответственность за использование полученных данных.
      `
    },
    privacy: {
      title: "Политика конфиденциальности",
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      text: `
        1. СБОР ИНФОРМАЦИИ
        1.1. Мы собираем минимально необходимый набор данных: email, IP-адрес для защиты аккаунта и логины мессенджеров для поддержки.

        2. ИСПОЛЬЗОВАНИЕ ДАННЫХ
        2.1. Данные используются исключительно для функционирования Сервиса и предотвращения мультиаккаунтинга.
        2.2. Мы никогда не передаем ваши данные третьим лицам.

        3. ХРАНЕНИЕ ДАННЫХ
        3.1. Все данные хранятся в зашифрованном виде на защищенных серверах.
        3.2. Вы можете запросить удаление своего аккаунта через личный кабинет.

        4. COOKIES
        4.1. Мы используем сессионные cookies для работы авторизации.
      `
    }
  };

  const active = content[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-[#0a0a0a] border border-white/5 p-6 md:p-10 rounded-[32px] w-full max-w-2xl relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors bg-white/5 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center">
                   {active.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{active.title}</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="whitespace-pre-wrap font-sans text-neutral-400 text-sm md:text-base leading-relaxed tracking-wide py-4">
                  {active.text}
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5">
                <button 
                  onClick={onClose}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors"
                >
                  Понятно
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
