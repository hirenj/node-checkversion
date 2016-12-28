# CheckVersion

Check versions of files using headers or regex to extract out the relevant
parts of the version strings.

Comparison is performed against an S3 Key, examining the `x-amz-meta-version` header.
(This header can be overridden using the `s3header` option).

The script gives a non-zero exit code if the versions are different

## Usage
```
checkversion --remote 'http://www.uniprot.org/uniprot/P12345' \
             --header 'x-uniprot-release' \
             --print || echo 'This will always give a non-zero exit code'
```

```
checkversion --s3header 'interpro' \
             --s3path 's3:::mybucket/interpro/meta-InterPro.tsv' \
             --remote 'ftp://ftp.ebi.ac.uk/pub/databases/interpro/current/release_notes.txt' \
             --regex 'Release (\d+\.\d+)' \
             --print \
             && echo 'Versions ok' || echo 'Need to Download'
```