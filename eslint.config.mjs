import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': 'warn', // Cảnh báo khi dùng console.log
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'], // Báo lỗi khi có biến không dùng
      eqeqeq: ['error', 'always'], // Bắt buộc dùng === thay vì ==
      '@typescript-eslint/explicit-function-return-type': 'off', // Không bắt buộc khai báo kiểu return
      // '@typescript-eslint/no-explicit-any': 'warn', // Cảnh báo khi dùng kiểu any
      'prettier/prettier': 'error', // Lỗi nếu không tuân theo Prettier
      'max-len': ['error', { code: 160, tabWidth: 2, ignoreUrls: true }], // Giới hạn độ dài của dòng code
    },
  },
];
