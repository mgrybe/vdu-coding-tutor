# Here's how to download a specific python module

```
pip install --platform manylinux2014_x86_64 --implementation cp --python 3.10 --only-binary=:all: --upgrade --target python/ numpy
```