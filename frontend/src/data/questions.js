const questions = [
  {
    id: 1,
    question:
      "What is the key characteristic that defines Big Data in terms of volume, velocity, and variety?",
    options: {
      A: "Volume refers to the amount of data, velocity to the speed of data processing, and variety to the different types of data",
      B: "Volume refers to data storage, velocity to data transfer speed, and variety to data formats",
      C: "Volume refers to data quantity, velocity to data generation speed, and variety to data sources",
      D: "Volume refers to data size, velocity to data movement speed, and variety to data structures",
    },
    correctAnswer: "A",
  },
  {
    id: 2,
    question:
      "Which data structure does a Python dictionary use internally for fast lookups?",
    options: {
      A: "Binary Search Tree",
      B: "Hash Table",
      C: "Linked List",
      D: "Array",
    },
    correctAnswer: "B",
  },
  {
    id: 3,
    question:
      "Which SQL command is used to retrieve unique values from a specific column in a table?",
    options: {
      A: "SELECT UNIQUE",
      B: "SELECT DISTINCT",
      C: "SELECT DIFFERENT",
      D: "SELECT UNIQUE VALUES",
    },
    correctAnswer: "B",
  },
  {
    id: 4,
    question:
      "Which machine learning algorithm is commonly used for classification tasks?",
    options: {
      A: "Linear Regression",
      B: "K-Means Clustering",
      C: "Decision Trees",
      D: "Principal Component Analysis",
    },
    correctAnswer: "C",
  },
  {
    id: 5,
    question:
      "What is the average time complexity of searching in a balanced binary search tree (BST)?",
    options: {
      A: "O(n)",
      B: "O(log n)",
      C: "O(n log n)",
      D: "O(1)",
    },
    correctAnswer: "B",
  },
  {
    id: 6,
    question:
      "What will be the output type of the Python expression: print(type([]))?",
    options: {
      A: "list",
      B: "array",
      C: "tuple",
      D: "sequence",
    },
    correctAnswer: "A",
  },
  {
    id: 7,
    question:
      "Which type of machine learning does not use labeled data for training?",
    options: {
      A: "Supervised Learning",
      B: "Unsupervised Learning",
      C: "Reinforcement Learning",
      D: "Deep Learning",
    },
    correctAnswer: "B",
  },
  {
    id: 8,
    question:
      "What boolean value does an empty list return when used in a conditional statement in Python?",
    options: {
      A: "True",
      B: "False",
      C: "None",
      D: "Error",
    },
    correctAnswer: "B",
  },
  {
    id: 9,
    question: "Which Python library is primarily used for data visualization?",
    options: {
      A: "NumPy",
      B: "Pandas",
      C: "Matplotlib",
      D: "SciPy",
    },
    correctAnswer: "C",
  },
  {
    id: 10,
    question:
      "In SQL, which type of JOIN returns only the matching rows from both tables?",
    options: {
      A: "LEFT JOIN",
      B: "RIGHT JOIN",
      C: "INNER JOIN",
      D: "FULL JOIN",
    },
    correctAnswer: "C",
  },
  {
    id: 11,
    question:
      "What type of data analysis is focused on predicting future trends based on historical data?",
    options: {
      A: "Descriptive Analytics",
      B: "Diagnostic Analytics",
      C: "Predictive Analytics",
      D: "Prescriptive Analytics",
    },
    correctAnswer: "C",
  },
  {
    id: 12,
    question:
      "Which built-in Python function is used to open a file for reading or writing?",
    options: {
      A: "file()",
      B: "open()",
      C: "read()",
      D: "write()",
    },
    correctAnswer: "B",
  },
  {
    id: 13,
    question: "What does 'ETL' stand for in data processing and analytics?",
    options: {
      A: "Extract, Transform, Load",
      B: "Enter, Transfer, Leave",
      C: "Extract, Transfer, Load",
      D: "Enter, Transform, Leave",
    },
    correctAnswer: "A",
  },
  {
    id: 14,
    question:
      "In Python, which keyword is used to handle exceptions in a try-except block?",
    options: {
      A: "catch",
      B: "except",
      C: "handle",
      D: "error",
    },
    correctAnswer: "B",
  },
  {
    id: 15,
    question:
      "What will be the result of executing the Python expression: 3 * 'Hello'?",
    options: {
      A: "Error",
      B: "HelloHelloHello",
      C: "3Hello",
      D: "Hello3",
    },
    correctAnswer: "B",
  },
  {
    id: 16,
    question:
      "What is the default axis used by the drop() method in a Pandas DataFrame?",
    options: {
      A: "axis=0 (rows)",
      B: "axis=1 (columns)",
      C: "axis=2 (both)",
      D: "No default axis",
    },
    correctAnswer: "A",
  },
  {
    id: 17,
    question:
      "What is one key difference between SQL and NoSQL databases in terms of schema structure?",
    options: {
      A: "SQL is faster than NoSQL",
      B: "SQL has a fixed schema while NoSQL is schema-less",
      C: "SQL can only handle structured data",
      D: "NoSQL can only handle unstructured data",
    },
    correctAnswer: "B",
  },
  {
    id: 18,
    question: "What does the 'lambda' keyword in Python define?",
    options: {
      A: "A class",
      B: "An anonymous function",
      C: "A module",
      D: "A decorator",
    },
    correctAnswer: "B",
  },
  {
    id: 19,
    question:
      "How can you safely remove a key from a dictionary in Python without raising an error if the key doesn't exist?",
    options: {
      A: "Using del keyword",
      B: "Using pop() method",
      C: "Using remove() method",
      D: "Using delete() method",
    },
    correctAnswer: "B",
  },
  {
    id: 20,
    question:
      "What function in Pandas is used to access DataFrame elements by their index position rather than their label?",
    options: {
      A: "loc[]",
      B: "iloc[]",
      C: "at[]",
      D: "iat[]",
    },
    correctAnswer: "B",
  },
  {
    id: 21,
    question: "Which keyword is used to define a function in Python?",
    options: {
      A: "func",
      B: "define",
      C: "def",
      D: "function",
    },
    correctAnswer: "C",
  },
  {
    id: 22,
    question: "Which SQL clause is used to filter records?",
    options: {
      A: "ORDER BY",
      B: "WHERE",
      C: "GROUP BY",
      D: "HAVING",
    },
    correctAnswer: "B",
  },
  {
    id: 23,
    question: "In machine learning, what does overfitting refer to?",
    options: {
      A: "Model is too simple",
      B: "Model performs well on training data but poorly on test data",
      C: "Model performs equally on all data",
      D: "Model fails to learn",
    },
    correctAnswer: "B",
  },
  {
    id: 24,
    question: "Which Python keyword is used to create a generator?",
    options: {
      A: "yield",
      B: "return",
      C: "generate",
      D: "async",
    },
    correctAnswer: "A",
  },
  {
    id: 25,
    question: "Which of these is a Python immutable data type?",
    options: {
      A: "list",
      B: "set",
      C: "tuple",
      D: "dictionary",
    },
    correctAnswer: "C",
  },
  {
    id: 26,
    question: "Which Python library is used for numerical computation?",
    options: {
      A: "Matplotlib",
      B: "NumPy",
      C: "Seaborn",
      D: "Scikit-learn",
    },
    correctAnswer: "B",
  },
  {
    id: 27,
    question: "Which SQL keyword is used to sort the result-set?",
    options: {
      A: "SORT",
      B: "ORDER",
      C: "ORDER BY",
      D: "GROUP",
    },
    correctAnswer: "C",
  },
  {
    id: 28,
    question: "Which Pandas function is used to read a CSV file?",
    options: {
      A: "pandas.read()",
      B: "pandas.load_csv()",
      C: "pandas.read_csv()",
      D: "pandas.import_csv()",
    },
    correctAnswer: "C",
  },
  {
    id: 29,
    question: "Which ML algorithm is best for regression problems?",
    options: {
      A: "Logistic Regression",
      B: "Decision Trees",
      C: "Linear Regression",
      D: "K-Means",
    },
    correctAnswer: "C",
  },
  {
    id: 30,
    question: "In Python, what does the 'break' keyword do in loops?",
    options: {
      A: "Skips the next iteration",
      B: "Stops the loop",
      C: "Restarts the loop",
      D: "Ends the program",
    },
    correctAnswer: "B",
  },
  {
    id: 31,
    question: "Which SQL function returns the number of records?",
    options: {
      A: "SUM()",
      B: "COUNT()",
      C: "TOTAL()",
      D: "LENGTH()",
    },
    correctAnswer: "B",
  },
  {
    id: 32,
    question: "What does CSV stand for?",
    options: {
      A: "Comma Separated Values",
      B: "Character Separated Values",
      C: "Column Separated Values",
      D: "Comma System Variables",
    },
    correctAnswer: "A",
  },
  {
    id: 33,
    question: "Which keyword is used in Python for inheritance?",
    options: {
      A: "inherits",
      B: "extends",
      C: "class",
      D: "super",
    },
    correctAnswer: "C",
  },
  {
    id: 34,
    question: "Which function is used to find the length of a list in Python?",
    options: {
      A: "length()",
      B: "size()",
      C: "count()",
      D: "len()",
    },
    correctAnswer: "D",
  },
  {
    id: 35,
    question: "Which data visualization library is built on top of Matplotlib?",
    options: {
      A: "NumPy",
      B: "Seaborn",
      C: "Pandas",
      D: "SciPy",
    },
    correctAnswer: "B",
  },
  {
    id: 36,
    question: "Which type of join includes all rows from both tables?",
    options: {
      A: "INNER JOIN",
      B: "LEFT JOIN",
      C: "RIGHT JOIN",
      D: "FULL JOIN",
    },
    correctAnswer: "D",
  },
  {
    id: 37,
    question:
      "Which Python function is used to convert a string to an integer?",
    options: {
      A: "string()",
      B: "str()",
      C: "int()",
      D: "convert()",
    },
    correctAnswer: "C",
  },
  {
    id: 38,
    question: "Which Pandas method is used to get summary statistics?",
    options: {
      A: "describe()",
      B: "info()",
      C: "summary()",
      D: "mean()",
    },
    correctAnswer: "A",
  },
  {
    id: 39,
    question: "What is the output of: type({}) in Python?",
    options: {
      A: "list",
      B: "dict",
      C: "set",
      D: "tuple",
    },
    correctAnswer: "B",
  },
  {
    id: 40,
    question: "Which Python method is used to get the keys of a dictionary?",
    options: {
      A: "getkeys()",
      B: "keys()",
      C: "values()",
      D: "items()",
    },
    correctAnswer: "B",
  },
  {
    id: 41,
    question: "Which method is used to add an element to a set in Python?",
    options: {
      A: "append()",
      B: "insert()",
      C: "add()",
      D: "push()",
    },
    correctAnswer: "C",
  },
  {
    id: 42,
    question: "What does the Python expression 10 // 3 return?",
    options: {
      A: "3.33",
      B: "3",
      C: "3.0",
      D: "Error",
    },
    correctAnswer: "B",
  },
  {
    id: 43,
    question:
      "Which SQL clause is used to group rows that have the same values?",
    options: {
      A: "GROUP",
      B: "GROUP BY",
      C: "ORDER BY",
      D: "FILTER BY",
    },
    correctAnswer: "B",
  },
  {
    id: 44,
    question: "Which Python function converts an object to a string?",
    options: {
      A: "toString()",
      B: "str()",
      C: "convert()",
      D: "string()",
    },
    correctAnswer: "B",
  },
  {
    id: 45,
    question:
      "What is the default join type in SQL when only JOIN is specified?",
    options: {
      A: "LEFT JOIN",
      B: "INNER JOIN",
      C: "FULL JOIN",
      D: "RIGHT JOIN",
    },
    correctAnswer: "B",
  },
  {
    id: 46,
    question: "Which of the following is a supervised learning algorithm?",
    options: {
      A: "K-Means",
      B: "PCA",
      C: "Linear Regression",
      D: "Apriori",
    },
    correctAnswer: "C",
  },
  {
    id: 47,
    question: "Which keyword is used in Python to check a condition?",
    options: {
      A: "case",
      B: "if",
      C: "switch",
      D: "when",
    },
    correctAnswer: "B",
  },
  {
    id: 48,
    question: "Which function is used to merge two DataFrames in Pandas?",
    options: {
      A: "combine()",
      B: "merge()",
      C: "append()",
      D: "join()",
    },
    correctAnswer: "B",
  },
  {
    id: 49,
    question: "Which symbol is used for comments in Python?",
    options: {
      A: "//",
      B: "/* */",
      C: "#",
      D: "<!-- -->",
    },
    correctAnswer: "C",
  },
  {
    id: 50,
    question: "Which command installs a Python package?",
    options: {
      A: "install package",
      B: "pip install package_name",
      C: "python install",
      D: "pkg install",
    },
    correctAnswer: "B",
  },
];

export default questions;
