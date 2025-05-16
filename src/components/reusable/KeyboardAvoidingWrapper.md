# KeyboardAvoidingWrapper Component

A reusable component that handles keyboard behavior across iOS and Android platforms, automatically adjusting the view to prevent the keyboard from covering input fields.

## Features

- Handles platform-specific keyboard behaviors
- Option to include a ScrollView for scrollable content
- Dismisses keyboard when touching outside of input fields
- Configurable vertical offset for adjusting position when keyboard appears
- Compatible with existing view hierarchies

## Usage

### Basic Usage

```jsx
import KeyboardAvoidingWrapper from '../components/reusable/KeyboardAvoidingWrapper';

const YourScreen = () => {
  return (
    <KeyboardAvoidingWrapper>
      {/* Your screen content here */}
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" secureTextEntry />
      <Button title="Submit" onPress={handleSubmit} />
    </KeyboardAvoidingWrapper>
  );
};
```

### With Custom Styling

```jsx
import KeyboardAvoidingWrapper from '../components/reusable/KeyboardAvoidingWrapper';
import { StyleSheet } from 'react-native';

const YourScreen = () => {
  return (
    <KeyboardAvoidingWrapper 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Your screen content here */}
    </KeyboardAvoidingWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
});
```

### With Header (Using Vertical Offset)

```jsx
import KeyboardAvoidingWrapper from '../components/reusable/KeyboardAvoidingWrapper';
import { View, Text } from 'react-native';

const YourScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 60 }}>
        <Text>Header</Text>
      </View>
      
      <KeyboardAvoidingWrapper keyboardVerticalOffset={60}>
        {/* Your screen content here */}
      </KeyboardAvoidingWrapper>
    </View>
  );
};
```

### Without ScrollView

```jsx
import KeyboardAvoidingWrapper from '../components/reusable/KeyboardAvoidingWrapper';

const YourScreen = () => {
  return (
    <KeyboardAvoidingWrapper withScrollView={false}>
      {/* Your screen content here */}
    </KeyboardAvoidingWrapper>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Content to render inside the keyboard avoiding view |
| style | Object | - | Additional styles for the container |
| contentContainerStyle | Object | - | Styles for the ScrollView content container |
| withScrollView | Boolean | true | Whether to wrap content in a ScrollView |
| keyboardVerticalOffset | Number | 0 | Offset from the top (useful when you have headers) | 