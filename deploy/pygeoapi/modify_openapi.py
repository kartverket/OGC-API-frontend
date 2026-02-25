import os
import yaml
import fcntl

def remove_post_endpoints(pattern):
    """
    Remove POST endpoints from the OpenAPI spec file if they match the given pattern.

    Args:
        pattern (re.Pattern): Compiled regex pattern to match paths against.
    """
    openapi_file = os.environ.get('PYGEOAPI_OPENAPI')
    if openapi_file and os.path.exists(openapi_file):
        print(f"Modifying OpenAPI spec at {openapi_file} to remove POST endpoints matching pattern")
        try:
            with open(openapi_file, 'r+') as _f:
                # Acquire an exclusive lock to prevent race conditions properly
                fcntl.flock(_f, fcntl.LOCK_EX)
                try:
                    _spec = yaml.safe_load(_f)

                    if isinstance(_spec, dict):
                        paths = _spec.get('paths', {})
                        paths_to_modify = [
                            p for p in paths
                            if pattern.search(p) and 'post' in paths[p]
                        ]

                        for p in paths_to_modify:
                            paths[p].pop('post')

                        if paths_to_modify:
                            # Move pointer to beginning of file and truncate it
                            _f.seek(0)
                            _f.truncate()
                            yaml.dump(_spec, _f, allow_unicode=True, sort_keys=False)
                    elif _spec is not None:
                        print(f"OpenAPI spec at {openapi_file} is not a valid dictionary. Skipping modification.")
                finally:
                    # Release the lock
                    fcntl.flock(_f, fcntl.LOCK_UN)
        except yaml.YAMLError as exc:
            print(f"Failed to parse OpenAPI spec at {openapi_file}: {exc}")
        except Exception as e:
            print(f"Failed to modify OpenAPI spec at {openapi_file}: {e}")

