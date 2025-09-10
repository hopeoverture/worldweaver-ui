export const folderColorOptions = [
  { value: 'blue', label: 'Blue', preview: 'bg-blue-500' },
  { value: 'green', label: 'Green', preview: 'bg-green-500' },
  { value: 'purple', label: 'Purple', preview: 'bg-purple-500' },
  { value: 'red', label: 'Red', preview: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', preview: 'bg-yellow-500' },
  { value: 'pink', label: 'Pink', preview: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', preview: 'bg-indigo-500' },
  { value: 'gray', label: 'Gray', preview: 'bg-gray-500' }
] as const;

export type FolderColor = typeof folderColorOptions[number]['value']

